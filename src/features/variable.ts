import { isCancel, select, text } from '@clack/prompts'
import { CliError, resolveCallbackable, resolveCallbackables } from '../utils'
import type { Choice, ConfigVariable, Context } from '../types'

export async function variable(context: Context): Promise<void> {
  const { template, project } = context
  const variablesList = await resolveCallbackables(template.variables, context)
  const variables: Record<string, ConfigVariable> = Object.assign(
    {},
    ...variablesList,
  )

  for (const [key, variable] of Object.entries(variables)) {
    let value: string | symbol | undefined

    if (variable.type === 'text') {
      const placeholder = await resolveCallbackable(
        variable.placeholder,
        context,
      )
      value = await text({
        message: variable.message,
        initialValue: variable.initial,
        placeholder,
        validate: (value) => {
          if (variable.required && !value) return 'This field is required.'
          return undefined
        },
      })
    } else {
      value = await select({
        message: variable.message,
        initialValue: variable.initial,
        // initial: variable.initial,
        options: variable.choices.map(
          (choice): Choice =>
            typeof choice === 'string' ? { value: choice } : choice,
        ),
      })
    }
    if (isCancel(value))
      throw new CliError(
        'Variable input canceled. Please run the command again.',
      )

    project.variables[key] = value
  }
}
