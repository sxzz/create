import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { load } from 'js-yaml'

export interface Template {
  name: string
  color?: string
  children?: Template[]
  url?: string
}

const demoTemplates = `
- id: lib               # An unique id
  name: Library
#  color: '#008800'     # optional
  children:
    - id: ts
      name: TypeScript
      color: '#3178c6'
      url: 'git@github.com:sxzz/node-lib-starter.git'      # remote URL or local path
`.trim()

export const loadTemplates = async (): Promise<Template[]> => {
  const filePath = path.resolve(homedir(), '.config/create-templates.yml')
  if (!existsSync(filePath)) {
    mkdir(path.dirname(filePath), { recursive: true }).catch(() => undefined)
    writeFile(filePath, demoTemplates)
    throw new Error(
      `Template configuration not found. A new configuration file is generated, please check ${filePath}`
    )
  }
  const contents = await readFile(filePath, 'utf-8')
  return load(contents) as any
}
