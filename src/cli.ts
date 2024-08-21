import cac from 'cac'
import consola from 'consola'
import { version } from '../package.json'
import { config, run } from '.'

const cli = cac('@sxzz/create')

cli
  .command('[projectPath]', 'create a project')
  .action((projectPath?: string) => {
    run(projectPath).catch((error) => error && consola.error(error))
  })
cli
  .command('config')
  .action(() => config().catch((error) => consola.error(error)))
cli.help()
cli.version(version)
cli.parse()
