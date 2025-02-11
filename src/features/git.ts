import ansis from 'ansis'
import consola from 'consola'
import { execa } from 'execa'
import type { Context } from '../types'

export async function git({ template, project }: Context): Promise<void> {
  if (template.git.init === false) return

  await execa('git', ['init', project.path], {
    stdout: 'ignore',
    stderr: 'inherit',
  })
  consola.success('Git initialized.')

  const run = (file: string, args?: readonly string[]) =>
    execa(file, args, {
      stdout: 'pipe',
      stderr: 'inherit',
      cwd: project.path,
    }).then((res) => res.stdout.trim())

  if (template.git.add) {
    await run('git', ['add', '.'])
    consola.success('All file contents are added to the index.')
  }

  let _name: string | undefined
  let _email: string | undefined

  if (template.git.name) {
    _name = template.git.name
    await run('git', ['config', 'user.name', template.git.name])
    consola.success(
      `Set git author name: ${ansis.cyan.bold(template.git.name)}`,
    )
  }
  if (template.git.email) {
    _email = template.git.email
    await run('git', ['config', 'user.email', template.git.email])
    consola.success(
      `Set git author e-mail: ${ansis.cyan.bold(template.git.email)}`,
    )
  }

  project.git = {
    async getName() {
      return (_name ||= await run('git', ['config', '--get', 'user.name']))
    },
    async getEmail() {
      return (_email ||= await run('git', ['config', '--get', 'user.email']))
    },
  }
}
