import prompts from 'prompts'
import { CliError, resolveCallbackables } from '../utils'
import type { ConfigVariable, Context } from '../types'

export async function variable(context: Context) {
  const { template, project } = context
  const variablesList = await resolveCallbackables(template.variables, context)
  const variables: Record<string, ConfigVariable> = Object.assign(
    {},
    ...variablesList,
  )

  let canceled = false
  for (const [key, variable] of Object.entries(variables)) {
    let options: prompts.PromptObject<string>
    if (variable.type === 'text') {
      options = {
        type: 'text',
        name: 'value',
        message: variable.message,
        initial: variable.initial,
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
        initial: variable.initial,
        choices: variable.choices.map((choice) =>
          typeof choice === 'string' ? { title: choice } : choice,
        ),
      }
    }
    const { value } = await prompts(options, {
      onCancel: () => (canceled = true),
    })
    if (canceled)
      throw new CliError(
        'Variable input canceled. Please run the command again.',
      )

    project.variables[key] = value
  }
}
