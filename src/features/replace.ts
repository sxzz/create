import path from 'node:path'
import escapeStringRegexp from 'escape-string-regexp'
import { toArray } from '@antfu/utils'
import chalk from 'chalk'
import consola from 'consola'
import replaceInFile from 'replace-in-file'
import type { ReplaceInFileConfig } from 'replace-in-file'
import type { TemplateNormalized } from '../config'
import type {
  ConfigReplace,
  ConfigReplaceFromCallback,
  ConfigReplaceToCallback,
  ProjectInfo,
} from '../types'

export async function replace(
  template: TemplateNormalized,
  project: ProjectInfo
) {
  for (const replace of template.replaces) {
    await doReplace(replace, project).catch((err) => {
      console.error(err)
    })
  }
}

async function doReplace(replace: ConfigReplace, project: ProjectInfo) {
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
      ? (file) => (replace.from as ConfigReplaceFromCallback)({ file, project })
      : toArray(replace.from).map((from) => buildPattern(from))
  ) as ReplaceInFileConfig['from']

  const to: ReplaceInFileConfig['to'] =
    typeof replace.to === 'function'
      ? (match, file) =>
          (replace.to as ConfigReplaceToCallback)({ match, file, project })
      : replace.to

  const results = await replaceInFile.replaceInFile({
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
        path.relative(project.path, result.file)
      )} was replaced in ${chalk.green(result.numReplacements)} place(s).`
    )
  }
}
