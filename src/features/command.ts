import consola from 'consola'
import { x } from 'tinyexec'
import { resolveCallbackables } from '../utils.ts'
import type { Context } from '../types.ts'

export async function command(context: Context): Promise<void> {
  const { template, project } = context
  const commands = await resolveCallbackables(template.commands, context)
  for (const command of commands.flat()) {
    consola.info(`Running command: ${command}`)
    const { exitCode } = await x(command, undefined, {
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
