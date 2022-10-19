import path from 'node:path'
import prompts from 'prompts'
import { downloadTemplate } from 'giget'
import consola from 'consola'
import chalk from 'chalk'
import { objectKeys, objectPick } from '@antfu/utils'
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
    ...objectPick(
      config,
      objectKeys(config).filter((k) => k !== 'templates')
    ),
  }

  const templateStacks: ConfigTemplate[] = [currentTemplate]
  do {
    let canceled = false
    const { templateName } = await prompts(
      {
        type: 'select',
        name: 'templateName',
        message: 'Pick a template',
        choices: currentTemplate.children!.map(
          ({ name, color }): prompts.Choice => {
            return {
              value: name,
              title: getColor(color)(name),
            }
          }
        ),
      },
      { onCancel: () => (canceled = true) }
    )
    if (canceled) {
      templateStacks.pop()
      if (templateStacks.length === 0) {
        consola.error(chalk.red('Operation cancelled'))
        process.exit(1)
      }
      currentTemplate = templateStacks[templateStacks.length - 1]
      continue
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
    ;({ relatePath } = await prompts({
      type: 'text',
      name: 'relatePath',
      message: 'Your project name? (or path)',
      validate: (v) =>
        v.length === 0 ? 'project name cannot be empty.' : true,
    }))
  }

  const projectPath = path.resolve(process.cwd(), relatePath!)
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

  await downloadTemplate(url, {
    provider: 'github',
    dir: projectPath,
  })

  await git(ctx)
  await replace(ctx)
  await command(ctx)

  consola.success(
    `${chalk.green.bold(`Done. Now run:`)}\n\n  ${chalk.blueBright(
      `cd ${relatePath}`
    )}\n`
  )
}
