import enquirer from 'enquirer'
import type { Context } from '../types'

export async function variable({ template, project }: Context) {
  for (const [key, variable] of Object.entries(template.variables)) {
    const def =
      typeof variable === 'function'
        ? await variable({ template, project })
        : variable

    const { value } = await enquirer.prompt<{ value: string }>({
      name: 'value',

      type: def.type,
      message: def.message,
      initial: def.initial,
      required: def.required,
    })

    project.variables[key] = value
  }
}
