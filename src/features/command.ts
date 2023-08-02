import consola from 'consola'
import { execaCommand } from 'execa'
import { resolveCallbackables } from '../utils'
import { type Context } from '../types'

export async function command(context: Context) {
  const { template, project } = context
  const commands = await resolveCallbackables(template.commands, context)
  for (const command of commands.flat()) {
    consola.info(`Running command: ${command}`)
    const { exitCode } = await execaCommand(command, {
      stdio: 'inherit',
      cwd: project.path,
      shell: true,
    })
    if (exitCode !== 0)
      consola.error(`Command failed with exit code ${exitCode}`)
  }
}
