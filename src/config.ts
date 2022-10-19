import { homedir } from 'node:os'
import path from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dump, load } from 'js-yaml'
import { loadConfig } from 'unconfig'
import consola from 'consola'
import chalk from 'chalk'
import { execa } from 'execa'
import prompts from 'prompts'
import { objectPick, toArray } from '@antfu/utils'
import { findConfigTypePath, which } from './utils'
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
          url: 'git@github.com:sxzz/node-lib-starter.git',
        },
      ],
    },
    {
      name: 'Web App',
      url: 'git@github.com:sxzz/node-lib-starter.git',
      git: {
        init: false,
      },
    },
  ],
}

export const configPath = path.resolve(homedir(), '.config/create.config')

export const getConfig = async (
  init = true
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
          return load(await readFile(filePath, 'utf8'))
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
  if (!newConfig) throw new Error('No configuration file found.')
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
    })),
  })) as { kind: 'JavaScript' | 'TypeScript' | 'JSON' | 'YAML' }

  await mkdir(path.dirname(configPath), { recursive: true }).catch(
    () => undefined
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
      const configTypePath = (await findConfigTypePath()).replace(/\\/g, '/')
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
  if ((await which('code')) === 0) {
    await execa('code', ['-w', filePath])
  } else if ((await which('vim')) === 0) {
    await execa('vim', [filePath], { stdio: 'inherit' })
  } else {
    consola.info(
      `VSCode and Vim are not detected, please open and edit config file manually: ${filePath}`
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
  templates: ConfigTemplate[]
): TemplateNormalized {
  const normalizeReplaces = (
    replaces: ConfigTemplate['replaces']
  ): ConfigReplace[] => {
    if (!replaces) return []
    return Array.isArray(replaces)
      ? replaces
      : toArray(replaces.items).map(
          (replace) =>
            ({
              ...objectPick(replaces, ['from', 'to', 'include', 'exclude']),
              ...replace,
            } as ConfigReplace)
        )
  }

  const mergeTemplate = (
    a: TemplateNormalized,
    b: ConfigTemplate
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
