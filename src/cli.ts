#!/usr/bin/env node
import cac from 'cac'
import consola from 'consola'
import pkg from '../package.json' with { type: 'json' }
import { fromTemplate } from './from.ts'
import { edit, run } from './index.ts'

const cli = cac('@sxzz/create')

cli
  .command('[projectPath]', 'create a project')
  .action((projectPath?: string) => {
    run({ projectPath }).catch((error) => error && consola.error(error))
  })
cli
  .command('from <template>', 'create a project from a template')
  .action((template) => {
    fromTemplate(template).catch((error) => consola.error(error))
  })
cli
  .command('edit')
  .alias('config')
  .action(() => edit().catch((error) => consola.error(error)))

cli.help().version(pkg.version).parse()
