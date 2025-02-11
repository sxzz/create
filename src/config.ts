import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { objectPick, toArray } from '@antfu/utils'
import { confirm, isCancel, select } from '@clack/prompts'
import ansis from 'ansis'
import consola from 'consola'
import { dump, load } from 'js-yaml'
import { x } from 'tinyexec'
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

export const configPath: string = path.resolve(
  homedir(),
  '.config/create.config',
)

export async function getConfig({
  init = true,
}: { init?: boolean } = {}): Promise<{
  exists: boolean
  init: boolean
  config: ConfigNormalized
  file: string
}> {
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

  consola.warn(ansis.yellowBright('No configuration file found.'))

  const filePath = await initConfig()
  await editConfig(filePath)

  const newConfig = await getConfig({ init: false })
  if (!newConfig) throw new CliError('No configuration file found.')
  return { ...newConfig, init: true }
}

export async function initConfig(): Promise<string> {
  const create = await confirm({
    message: 'Do you want to create a configuration file?',
    initialValue: true,
  })
  if (isCancel(create) || !create) {
    process.exit(1)
  }

  const options = (['JavaScript', 'TypeScript', 'JSON', 'YAML'] as const).map(
    (kind) => ({ value: kind }),
  )
  const kind = await select({
    message: 'What kind of configuration file do you want to create?',
    options,
  })
  if (isCancel(kind)) {
    process.exit(1)
  }

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

export async function editConfig(filePath: string): Promise<void> {
  if (await cmdExists('code')) {
    await x('code', [filePath])
  } else if (await cmdExists('zed')) {
    await x('zed', [filePath], { nodeOptions: { stdio: 'inherit' } })
  } else if (await cmdExists('vim')) {
    await x('vim', [filePath], { nodeOptions: { stdio: 'inherit' } })
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
