import { program } from 'commander'
import consola from 'consola'
import { config, run } from '.'

program
  .argument('[projectPath]', 'project path')
  .action((projectPath?: string) => {
    run(projectPath).catch((error) => error && consola.error(error))
  })
program
  .command('config')
  .action(() => config().catch((error) => consola.error(error)))
program.parse()
