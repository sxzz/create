import path from 'node:path'
import escapeStringRegexp from 'escape-string-regexp'
import enquirer from 'enquirer'
import degit from 'degit'
import consola from 'consola'
import chalk from 'chalk'
import { program } from 'commander'
import { execa, execaCommand } from 'execa'
import replaceInFile from 'replace-in-file'
import { toArray } from '@antfu/utils'
import { getColor } from './utils'
import { editConfig, getConfig } from './config'
import type { ReplaceInFileConfig } from 'replace-in-file'
import type {
  ConfigReplace,
  ConfigReplaceFromCallback,
  ConfigReplaceToCallback,
  ProjectInfo,
} from './types'
import type { TemplateNormalized } from './config'

program
  .argument('[projectPath]', 'project path')
  .action((projectPath?: string) => {
    run(projectPath).catch((err) => err && consola.error(err))
  })
program
  .command('config')
  .action(() => config().catch((err) => consola.error(err)))
program.parse()

async function config() {
  const { init, file } = await getConfig()
  if (!init) editConfig(file)
}

async function run(projectPath?: string) {
  const {
    config: { templates },
  } = await getConfig()
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
      await create({
        projectPath,
        template,
      })
      break
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
  }

  const emitter = degit(url)
  await emitter.clone(projectPath)

  if (template.git.init) {
    await execa('git', ['init', projectPath], {
      stdout: 'ignore',
      stderr: 'inherit',
    })
    consola.success('Git initialized.')
  }

  if (template.git.init && template.git.add) {
    await execa('git', ['add', '.'], {
      stdout: 'ignore',
      stderr: 'inherit',
      cwd: projectPath,
    })
    consola.success('All file contents are added to the index.')
  }

  for (const replace of template.replaces) {
    await replaceContents(replace, project).catch((err) => {
      console.error(err)
    })
  }

  for (const command of toArray(template.commands)) {
    consola.info(`Running command: ${command}`)
    await execaCommand(command, {
      stdio: 'inherit',
      cwd: projectPath,
      shell: true,
    })
  }

  consola.success(
    `${chalk.green.bold(`Done. Now run:`)}\n\n  ${chalk.blueBright(
      `cd ${relatePath}`
    )}\n`
  )
}

async function replaceContents(replace: ConfigReplace, project: ProjectInfo) {
  const { all = true, ignoreCase = false } = replace

  const buildPattern = (from: string | RegExp) => {
    if (typeof from !== 'string') return from
    if (!(all || ignoreCase)) return from

    let flags = ''
    if (ignoreCase) flags += 'i'
    if (all) flags += 'g'
    return new RegExp(escapeStringRegexp(from), flags)
  }

  const from = (
    typeof replace.from === 'function'
      ? (file) => (replace.from as ConfigReplaceFromCallback)({ file, project })
      : toArray(replace.from).map((from) => buildPattern(from))
  ) as ReplaceInFileConfig['from']

  const to: ReplaceInFileConfig['to'] =
    typeof replace.to === 'function'
      ? (match, file) =>
          (replace.to as ConfigReplaceToCallback)({ match, file, project })
      : replace.to

  const results = await replaceInFile.replaceInFile({
    files: replace.include ?? '**/*',
    ignore: replace.exclude,
    from,
    to,
    countMatches: true,
    glob: {
      cwd: project.path,
      absolute: true,
    },
  })
  for (const result of results) {
    if (!result.hasChanged) continue
    consola.info(
      `${chalk.blue.bold(
        path.relative(project.path, result.file)
      )} was replaced in ${chalk.green(result.numReplacements)} place(s).`
    )
  }
}
