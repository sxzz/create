import type { TemplateNormalized } from './config'
import type { Arrayable, Awaitable } from '@antfu/utils'

export interface ProjectInfo {
  url: string
  folderName: string
  path: string
  variables: Record<string, any>
  git?: {
    name: string
    email: string
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
  } & Context
) => ConfigReplaceFrom
export type ConfigReplaceTo = Arrayable<string>
export type ConfigReplaceToCallback = (
  options: {
    match: string
    file: String
  } & Context
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
  title: string
  description?: string

  value?: string
  disabled?: boolean
  selected?: boolean

  /** @deprecated */
  name: string
  /** @deprecated */
  message?: string
}

export type ConfigVariable = { message: string; initial?: string } & (
  | {
      /** @deprecated */
      type: 'input'
      required?: boolean
    }
  | { type: 'text'; required?: boolean }
  | { type: 'select'; choices: string[] | Choice[] }
)

export interface ConfigTemplate {
  name: string
  color?: string
  children?: ConfigTemplate[]
  url?: string

  git?: {
    /** @default true */
    init?: boolean
    /** @default false */
    add?: boolean
    name?: string
    email?: string
  }

  variables?: Record<
    string,
    ConfigVariable | ((ctx: Context) => Awaitable<ConfigVariable>)
  >

  replaces?:
    | ({ items: Arrayable<Partial<ConfigReplace>> } & Partial<ConfigReplace>)
    | ConfigReplace[]

  /** @beta */
  commands?: Arrayable<string>
}

export interface Config
  extends Pick<ConfigTemplate, 'git' | 'replaces' | 'variables'> {
  templates?: Arrayable<ConfigTemplate>
}
