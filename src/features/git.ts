import consola from 'consola'
import { execa } from 'execa'
import type { Context } from '../types'

export async function git({ template, project }: Context) {
  if (template.git.init) {
    await execa('git', ['init', project.path], {
      stdout: 'ignore',
      stderr: 'inherit',
    })
    consola.success('Git initialized.')
  }

  if (template.git.init && template.git.add) {
    await execa('git', ['add', '.'], {
      stdout: 'ignore',
      stderr: 'inherit',
      cwd: project.path,
    })
    consola.success('All file contents are added to the index.')
  }
}
