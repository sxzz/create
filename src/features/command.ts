import { tokenizeArgs } from 'args-tokenizer'
import consola from 'consola'
import { x } from 'tinyexec'
import { resolveCallbackables } from '../utils'
import type { Context } from '../types'

export async function command(context: Context): Promise<void> {
  const { template, project } = context
  const commands = await resolveCallbackables(template.commands, context)
  for (const command of commands.flat()) {
    consola.info(`Running command: ${command}`)
    const [cmd, ...args] = tokenizeArgs(command)
    const { exitCode } = await x(cmd, args, {
      nodeOptions: {
        stdio: 'inherit',
        cwd: project.path,
        shell: true,
      },
    })
    if (exitCode !== 0)
      consola.error(`Command failed with exit code ${exitCode}`)
  }
}
