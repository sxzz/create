import { program } from 'commander'
import consola from 'consola'
import { config, run } from '.'

program
  .argument('[projectPath]', 'project path')
  .action((projectPath?: string) => {
    run(projectPath).catch((err) => err && consola.error(err))
  })
program
  .command('config')
  .action(() => config().catch((err) => consola.error(err)))
program.parse()
