import { exec } from 'node:child_process'
import enquirer from 'enquirer'
import degit from 'degit'
import consola from 'consola'
import chalk from 'chalk'
import { getColor } from './utils'
import { loadTemplates } from './template'
import type { Template } from './template'

async function run() {
  const templates = await loadTemplates()
  let currentTemplates = templates
  do {
    const answer = await enquirer.prompt<{ name: string }>({
      type: 'select',
      name: 'name',
      message: 'Pick a template',
      choices: currentTemplates.map(({ name, color }) => {
        return { name, message: getColor(color)(name) }
      }),
    })
    const template = currentTemplates.find(({ name }) => name === answer.name)!
    if (template.url) {
      await create(template)
      break
    } else if (template.children) {
      currentTemplates = template.children
    } else {
      throw new Error(`Bad template: ${JSON.stringify(template)}`)
    }
    // eslint-disable-next-line no-constant-condition
  } while (true)
}

async function create(template: Template) {
  const { projectName } = await enquirer.prompt<{ projectName: string }>({
    type: 'input',
    name: 'projectName',
    message: 'Your project name?',
  })

  const emitter = degit(template.url!)
  await emitter.clone(projectName)
  exec(`git init ${projectName}`)

  consola.success(chalk.green.bold('Created successfully!'))
}

run().catch((err) => consola.error(err))
