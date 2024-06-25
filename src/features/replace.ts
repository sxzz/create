import path from 'node:path'
import escapeStringRegexp from 'escape-string-regexp'
import { toArray } from '@antfu/utils'
import chalk from 'chalk'
import consola from 'consola'
import { type ReplaceInFileConfig, replaceInFile } from 'replace-in-file'
import type {
  ConfigReplace,
  ConfigReplaceFromCallback,
  ConfigReplaceToCallback,
  Context,
} from '../types'

export async function replace(ctx: Context) {
  const { template } = ctx
  for (const replace of template.replaces) {
    await doReplace(ctx, replace).catch((error) => {
      console.error(error)
    })
  }
}

async function doReplace(
  { template, project }: Context,
  replace: ConfigReplace,
) {
  const { all = true, ignoreCase = false } = replace

  const buildPattern = (from: string | RegExp) => {
    if (typeof from !== 'string') return from
    if (!(all || ignoreCase)) return from

    let flags = ''
    if (ignoreCase) flags += 'i'
    if (all) flags += 'g'
    return new RegExp(escapeStringRegexp(from), flags)
  }

  const from = (
    typeof replace.from === 'function'
      ? (file) =>
          (replace.from as ConfigReplaceFromCallback)({
            file,
            project,
            template,
          })
      : toArray(replace.from).map((from) => buildPattern(from))
  ) as ReplaceInFileConfig['from']

  const to: ReplaceInFileConfig['to'] =
    typeof replace.to === 'function'
      ? (match, file) =>
          (replace.to as ConfigReplaceToCallback)({
            match,
            file,
            project,
            template,
          })
      : replace.to

  const results = await replaceInFile({
    files: replace.include ?? '**/*',
    ignore: replace.exclude,
    from,
    to,
    countMatches: true,
    glob: {
      cwd: project.path,
      absolute: true,
    },
  })
  for (const result of results) {
    if (!result.hasChanged) continue
    consola.info(
      `${chalk.blue.bold(
        path.relative(project.path, result.file),
      )} was replaced in ${chalk.green(result.numReplacements)} place(s).`,
    )
  }
}
