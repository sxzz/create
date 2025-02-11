import type { TemplateNormalized } from './config'
import type { Arrayable, Awaitable } from '@antfu/utils'

export interface ProjectInfo {
  url: string
  folderName: string
  path: string
  variables: Record<string, any>
  git?: {
    getName: () => Promise<string>
    getEmail: () => Promise<string>
  }
}

export interface Context {
  project: ProjectInfo
  template: TemplateNormalized
}

export interface ConfigGit {
  /** @default true */
  init?: boolean
  /** @default false */
  add?: boolean
}

export type ConfigReplaceFrom = Arrayable<string | RegExp>
export type ConfigReplaceFromCallback = (
  options: {
    file: string
  } & Context,
) => ConfigReplaceFrom
export type ConfigReplaceTo = Arrayable<string>
export type ConfigReplaceToCallback = (
  options: {
    match: string
    file: string
  } & Context,
) => ConfigReplaceTo

export interface ConfigReplace {
  include?: Arrayable<string>
  exclude?: Arrayable<string>
  from: ConfigReplaceFrom | ConfigReplaceFromCallback
  to: ConfigReplaceTo | ConfigReplaceToCallback
  /** @default true */
  all?: boolean
  /** @default false */
  ignoreCase?: boolean
}

export interface Choice {
  value: string
  label?: string
  hint?: string
}

export type ConfigVariable = { message: string; initial?: string } & (
  | {
      type: 'text'
      required?: boolean
      placeholder?: Callbackable<string>
    }
  | { type: 'select'; choices: string[] | Choice[] }
)

export type Callbackable<T> = Awaitable<T> | ((ctx: Context) => Awaitable<T>)

export interface ConfigTemplate {
  name: string
  color?: string
  children?: ConfigTemplate[]
  /**
   * Format: [provider]:repo[/subpath][#ref]
   *
   * See also https://github.com/unjs/giget#downloadtemplatesource-options
   */
  url?: string

  git?: {
    /** @default true */
    init?: boolean
    /** @default false */
    add?: boolean
    name?: string
    email?: string
  }

  variables?: Callbackable<Record<string, ConfigVariable>>

  replaces?:
    | ({ items: Arrayable<Partial<ConfigReplace>> } & Partial<ConfigReplace>)
    | ConfigReplace[]

  commands?: Callbackable<Arrayable<string>>
  cwd?: string
}

export interface Config
  extends Pick<
    ConfigTemplate,
    'git' | 'replaces' | 'variables' | 'commands' | 'cwd'
  > {
  templates?: Arrayable<ConfigTemplate>
}
