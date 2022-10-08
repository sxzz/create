import path from 'node:path'
import enquirer from 'enquirer'
import degit from 'degit'
import consola from 'consola'
import chalk from 'chalk'
import { objectPick } from '@antfu/utils'
import { getColor } from './utils'
import { editConfig, getConfig, normalizeTemplate } from './config'
import { git } from './features/git'
import { replace } from './features/replace'
import { command } from './features/command'
import { variable } from './features/variable'

import type { ConfigTemplate, Context, ProjectInfo } from './types'
import type { ConfigNormalized, TemplateNormalized } from './config'

export async function config() {
  const { init, file } = await getConfig()
  if (!init) editConfig(file)
}

export async function run(projectPath?: string) {
  const { config } = await getConfig()
  const templates = await chooseTemplate(config)
  const template = normalizeTemplate(templates)
  await create({ projectPath, template })
}

async function chooseTemplate(config: ConfigNormalized) {
  let currentTemplate: ConfigTemplate = {
    name: '',
    children: config.templates,
    ...objectPick(config, ['git', 'replaces', 'variables']),
  }

  const templateStacks: ConfigTemplate[] = [currentTemplate]
  do {
    let templateName: string
    let canceled = false
    try {
      ;({ templateName } = await enquirer.prompt<{ templateName: string }>({
        type: 'select',
        name: 'templateName',
        message: 'Pick a template',
        choices: currentTemplate.children!.map(({ name, color }) => {
          return { name, message: getColor(color)(name) }
        }),
        onCancel() {
          canceled = true
          return true
        },
      }))
    } catch (err: any) {
      if (canceled) {
        templateStacks.pop()
        if (templateStacks.length === 0) process.exit(1)
        currentTemplate = templateStacks[templateStacks.length - 1]
        continue
      } else throw err
    }
    const template = currentTemplate.children!.find(
      ({ name }) => name === templateName
    )!
    if (template.url) {
      return [...templateStacks, template]
    } else if (template.children) {
      templateStacks.push(template)
      currentTemplate = template
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
