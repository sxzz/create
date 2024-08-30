import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { objectPick, toArray } from '@antfu/utils'
import chalk from 'chalk'
import consola from 'consola'
import { execa } from 'execa'
import { dump, load } from 'js-yaml'
import prompts from 'prompts'
import { loadConfig } from 'unconfig'
import { CliError, cmdExists, findConfigTypePath } from './utils'
import type { Config, ConfigReplace, ConfigTemplate } from './types'

type MergeObject<O, T> = Omit<O, keyof T> & T

export type TemplateNormalized = MergeObject<
  ConfigTemplate,
  {
    children?: TemplateNormalized[]
    git: NonNullable<ConfigTemplate['git']>
    replaces: ConfigReplace[]
    variables: Array<NonNullable<ConfigTemplate['variables']>>
    commands: Array<NonNullable<ConfigTemplate['commands']>>
  }
>
export type ConfigNormalized = MergeObject<
  Config,
  { templates: Array<ConfigTemplate> }
>

const demoConfig: Config = {
  git: {
    add: true,
  },
  templates: [
    {
      name: 'Library',
      color: 'green',
      children: [
        {
          name: 'TypeScript',
          color: '#3178c6',
          url: 'sxzz/node-lib-starter',
        },
      ],
    },
    {
      name: 'Web App',
      url: 'sxzz/node-lib-starter',
      git: {
        init: false,
      },
    },
  ],
}

export const configPath = path.resolve(homedir(), '.config/create.config')

export const getConfig = async (
  init = true,
): Promise<{
  exists: boolean
  init: boolean
  config: ConfigNormalized
  file: string
}> => {
  const { config, sources } = await loadConfig<Config>({
    sources: [
      { files: configPath },
      {
        files: configPath,
        extensions: ['yaml', 'yml'],
        async parser(filePath) {
          return load(await readFile(filePath, 'utf8')) as Config
        },
      },
    ],
  })

  if (sources.length > 0) {
    return {
      exists: true,
      init: false,
      config: config as ConfigNormalized,
      file: sources[0],
    }
  }

  if (!init)
    return {
      exists: false,
      init: false,
      config: undefined as any,
      file: '',
    }

  consola.warn(chalk.yellowBright('No configuration file found.'))

  const filePath = await initConfig()
  await editConfig(filePath)

  const newConfig = await getConfig(false)
  if (!newConfig) throw new CliError('No configuration file found.')
  return { ...newConfig, init: true }
}

export const initConfig = async () => {
  const { create } = await prompts({
    type: 'confirm',
    name: 'create',
    message: 'Do you want to create a configuration file?',
    initial: true,
  })
  if (!create) {
    process.exit(1)
  }

  const { kind } = (await prompts({
    type: 'select',
    name: 'kind',
    message: 'What kind of configuration file do you want to create?',
    choices: ['JavaScript', 'TypeScript', 'JSON', 'YAML'].map((kind) => ({
      title: kind,
      value: kind,
    })),
  })) as { kind: 'JavaScript' | 'TypeScript' | 'JSON' | 'YAML' }

  await mkdir(path.dirname(configPath), { recursive: true }).catch(
    () => undefined,
  )
  let filePath = configPath
  let contents: string
  switch (kind) {
    case 'JSON':
      filePath += '.json'
      contents = JSON.stringify(demoConfig, undefined, 2)
      break
    case 'JavaScript':
      filePath += '.js'
      contents = `export default ${JSON.stringify(demoConfig, undefined, 2)}`
      break
    case 'TypeScript': {
      filePath += '.ts'
      const configTypePath = (await findConfigTypePath()).replaceAll('\\', '/')
      contents = `import type { Config } from '${configTypePath}'

const config: Config = ${JSON.stringify(demoConfig, undefined, 2)}

export default config
`
      break
    }
    case 'YAML':
      filePath += '.yml'
      contents = dump(demoConfig)
      break
  }
  await writeFile(filePath, contents)
  return filePath
}

export async function editConfig(filePath: string) {
  if (await cmdExists('code')) {
    await execa('code', ['-w', filePath])
  } else if (await cmdExists('zed')) {
    await execa('zed', [filePath], { stdio: 'inherit' })
  } else if (await cmdExists('vim')) {
    await execa('vim', [filePath], { stdio: 'inherit' })
  } else {
    consola.info(
      `VSCode and Vim are not detected, please open and edit config file manually: ${filePath}`,
    )
  }
}

export function normalizeConfig(config: Config): ConfigNormalized {
  return {
    ...config,
    templates: toArray(config.templates),
  }
}

export function normalizeTemplate(
  templates: ConfigTemplate[],
): TemplateNormalized {
  const normalizeReplaces = (
    replaces: ConfigTemplate['replaces'],
  ): ConfigReplace[] => {
    if (!replaces) return []
    return Array.isArray(replaces)
      ? replaces
      : toArray(replaces.items).map(
          (replace) =>
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            ({
              ...objectPick(replaces, ['from', 'to', 'include', 'exclude']),
              ...replace,
            }) as ConfigReplace,
        )
  }

  const mergeTemplate = (
    a: TemplateNormalized,
    b: ConfigTemplate,
  ): TemplateNormalized => ({
    ...a,
    ...b,
    git: {
      ...a.git,
      ...(b.git || {}),
    },
    replaces: [
      ...normalizeReplaces(a.replaces),
      ...normalizeReplaces(b.replaces),
    ],
    variables: [...a.variables, ...(b.variables ? [b.variables] : [])],
    commands: [...a.commands, ...(b.commands ? [b.commands] : [])],
    children: undefined,
  })

  const initial: TemplateNormalized = {
    name: '',
    git: {},
    replaces: [],
    variables: [],
    commands: [],
  }
  return templates.reduce((a, b) => mergeTemplate(a, b), initial)
}
