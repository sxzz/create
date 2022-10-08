import path from 'node:path'
import enquirer from 'enquirer'
import degit from 'degit'
import consola from 'consola'
import chalk from 'chalk'
import { getColor } from './utils'
import { editConfig, getConfig } from './config'
import { git } from './features/git'
import { replace } from './features/replace'
import { command } from './features/command'
import { variable } from './features/variable'

import type { Context, ProjectInfo } from './types'
import type { TemplateNormalized } from './config'

export async function config() {
  const { init, file } = await getConfig()
  if (!init) editConfig(file)
}

export async function run(projectPath?: string) {
  const {
    config: { templates },
  } = await getConfig()
  const template = await chooseTemplate(templates)

  await create({ projectPath, template })
}

async function chooseTemplate(templates: TemplateNormalized[]) {
  let currentTemplates = templates
  const templateStacks = []
  do {
    let templateName: string
    let canceled = false
    try {
      ;({ templateName } = await enquirer.prompt<{ templateName: string }>({
        type: 'select',
        name: 'templateName',
        message: 'Pick a template',
        choices: currentTemplates.map(({ name, color }) => {
          return { name, message: getColor(color)(name) }
        }),
        onCancel() {
          canceled = true
          return true
        },
      }))
    } catch (err: any) {
      if (canceled) {
        currentTemplates = templateStacks.pop()!
        if (!currentTemplates) process.exit(1)
        continue
      } else throw err
    }
    const template = currentTemplates.find(({ name }) => name === templateName)!
    if (template.url) {
      return template
    } else if (template.children) {
      templateStacks.push(currentTemplates)
      currentTemplates = template.children
    } else {
      throw new Error(`Bad template: ${JSON.stringify(template)}`)
    }
    // eslint-disable-next-line no-constant-condition
  } while (true)
}

async function create({
  template,
  projectPath: relatePath,
}: {
  template: TemplateNormalized
  projectPath?: string
}) {
  if (!relatePath) {
    ;({ relatePath } = await enquirer.prompt<{ relatePath: string }>({
      type: 'input',
      name: 'relatePath',
      message: 'Your project name? (or path)',
    }))
  }

  const projectPath = path.resolve(process.cwd(), relatePath)
  const folderName = path.basename(projectPath)
  const url = template.url!
  const project: ProjectInfo = {
    url,
    folderName,
    path: projectPath,
    variables: {},
  }
  const ctx: Context = { template, project }

  await variable(ctx)

  const emitter = degit(url)
  await emitter.clone(projectPath)

  await git(ctx)
  await replace(ctx)
  await command(ctx)

  consola.success(
    `${chalk.green.bold(`Done. Now run:`)}\n\n  ${chalk.blueBright(
      `cd ${relatePath}`
    )}\n`
  )
}
