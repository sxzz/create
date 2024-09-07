import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { load } from 'js-yaml'
import { loadConfig } from 'unconfig'
import { normalizeConfig } from './config'
import { CliError } from './utils'
import type { Config } from './types'
import { run } from '.'

export async function fromTemplate(template: string) {
  const contents = await fetch(
    template.startsWith('https://')
      ? template
      : `https://raw.githubusercontent.com/${template}`,
  ).then((res) => res.text())
  const filename = template.split('/').pop()!

  const tempDir = await mkdtemp(path.join(tmpdir(), 'template-'))
  await writeFile(path.resolve(tempDir, filename), contents)

  let config: Config
  if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
    config = load(contents) as Config
  } else if (filename.endsWith('.json')) {
    config = JSON.parse(contents) as Config
  } else {
    const { config: _config, sources } = await loadConfig<Config>({
      sources: { files: filename, extensions: [] },
      cwd: tempDir,
      stopAt: tmpdir(),
    })
    config = _config
    if (!sources.length || !config)
      throw new CliError('Cannot resolve config file.')
  }

  run({ config: normalizeConfig(config) })
}
