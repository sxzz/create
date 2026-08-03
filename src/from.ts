import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { parse } from 'yaml'
import { normalizeConfig } from './config.ts'
import { run } from './index.ts'
import type { Config } from './types.ts'

export async function fromTemplate(template: string): Promise<void> {
  const url = template.startsWith('https://')
    ? template
    : `https://raw.githubusercontent.com/${template}`
  const contents = await fetch(url).then((res) => res.text())
  const filename = template.split('/').pop()!

  const tempDir = await mkdtemp(path.join(tmpdir(), 'create-template-'))
  const filePath = path.resolve(tempDir, filename)
  await writeFile(filePath, contents)

  let config: Config
  if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
    config = parse(contents) as Config
  } else if (filename.endsWith('.json')) {
    config = JSON.parse(contents) as Config
  } else {
    config = await import(filePath).then(
      (mod) => (mod?.default || mod) as Config,
    )
  }

  run({ config: normalizeConfig(config) })
}
