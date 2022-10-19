import prompts from 'prompts'
import { resolveCallbackable } from '../utils'
import type { Context } from '../types'

export async function variable(context: Context) {
  const { template, project } = context
  const variables = await resolveCallbackable(template.variables, context)
  for (const [key, variable] of Object.entries(variables)) {
    let options: prompts.PromptObject<string>
    if (variable.type === 'text') {
      options = {
        type: 'text',
        name: 'value',
        message: variable.message,
        validate: (value) => {
          if (variable.required && !value) return 'This field is required.'
          return true
        },
      }
    } else {
      options = {
        type: 'select',
        name: 'value',
        message: variable.message,
        choices: variable.choices.map((choice) =>
          typeof choice === 'string' ? { title: choice } : choice
        ),
      }
    }
    const { value } = await prompts(options)

    project.variables[key] = value
  }
}
