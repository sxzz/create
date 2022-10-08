import { homedir } from 'node:os'
import path from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dump, load } from 'js-yaml'
import { loadConfig } from 'unconfig'
import consola from 'consola'
import chalk from 'chalk'
import { execa } from 'execa'
import enquirer from 'enquirer'
import { objectPick, toArray } from '@antfu/utils'
import { findConfigTypePath, which } from './utils'
import type { Config, ConfigReplace, ConfigTemplate } from './types'

export type TemplateNormalized = Omit<ConfigTemplate, 'git' | 'children'> & {
  git: NonNullable<Required<ConfigTemplate['git']>>
  children?: TemplateNormalized[]
  replaces: ConfigReplace[]
}
export type ConfigNormalized = {
  templates: Array<TemplateNormalized>
}

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
      config: normalizeConfig(config),
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
  const { create } = await enquirer.prompt<{ create: boolean }>({
    type: 'confirm',
    name: 'create',
    message: 'Do you want to create a configuration file?',
    initial: true,
  })
  if (!create) {
    process.exit(1)
  }

  const { kind } = await enquirer.prompt<{
    kind: 'JavaScript' | 'TypeScript' | 'JSON' | 'YAML'
  }>({
    type: 'select',
    name: 'kind',
    message: 'What kind of configuration file do you want to create?',
    choices: ['JavaScript', 'TypeScript', 'JSON', 'YAML'],
  })

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
      contents = `import type { Config } from '${await findConfigTypePath()}'

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
  }
}

export function normalizeConfig(config: Config): ConfigNormalized {
  function normalizeReplaces(
    replaces: ConfigTemplate['replaces']
  ): ConfigReplace[] {
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

  function normalizeTemplate(template: ConfigTemplate): TemplateNormalized {
    return {
      ...template,
      git: {
        init: template.git?.init ?? config.git?.init ?? true,
        add: template.git?.add ?? config.git?.add ?? false,
      },
      children: template.children?.map((t) => normalizeTemplate(t)),
      replaces: [
        ...normalizeReplaces(config.replaces),
        ...normalizeReplaces(template.replaces),
      ],
    }
  }

  return {
    templates: toArray(config.templates).map((t) => normalizeTemplate(t)),
  }
}
