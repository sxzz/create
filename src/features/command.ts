import { toArray } from '@antfu/utils'
import consola from 'consola'
import { execaCommand } from 'execa'
import type { TemplateNormalized } from '../config'
import type { ProjectInfo } from '../types'

export async function command(
  template: TemplateNormalized,
  project: ProjectInfo
) {
  for (const command of toArray(template.commands)) {
    consola.info(`Running command: ${command}`)
    await execaCommand(command, {
      stdio: 'inherit',
      cwd: project.path,
      shell: true,
    })
  }
}
