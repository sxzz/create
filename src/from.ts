import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { loadConfig } from 'unconfig'
import { parse } from 'yaml'
import { normalizeConfig } from './config.ts'
import { CliError } from './utils.ts'
import type { Config } from './types.ts'
import { run } from './index.ts'

export async function fromTemplate(template: string): Promise<void> {
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
    config = parse(contents) as Config
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
