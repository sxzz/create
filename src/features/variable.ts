import prompts from 'prompts'
import type { Context } from '../types'

export async function variable({ template, project }: Context) {
  for (const [key, variable] of Object.entries(template.variables)) {
    const def =
      typeof variable === 'function'
        ? await variable({ template, project })
        : variable

    let options: prompts.PromptObject<string>
    if (def.type === 'text' || def.type === 'input') {
      options = {
        type: 'text',
        name: 'value',
        validate: (value) => {
          if (def.required && !value) return 'This field is required.'
          return true
        },
      }
    } else {
      options = {
        type: 'select',
        name: 'value',
        choices: def.choices.map((choice) => {
          const result: prompts.Choice = {
            title: typeof choice === 'string' ? choice : choice.name,
          }
          if (typeof choice !== 'string') {
            result.value = choice.value
            result.description = choice.message
            result.disabled = choice.disabled
            result.selected = choice.selected
          }
          return result
        }),
      }
    }
    const { value } = await prompts(options)

    project.variables[key] = value
  }
}
