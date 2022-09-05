import { exec } from 'node:child_process'
import enquirer from 'enquirer'
import degit from 'degit'
import consola from 'consola'
import chalk from 'chalk'
import { getColor } from './utils'
import { templates } from './template'
import type { Template } from './template'

let currentTemplates = templates

async function run() {
  do {
    const answer = await enquirer.prompt<{ id: string }>({
      type: 'select',
      name: 'id',
      message: 'Pick a template',
      choices: currentTemplates.map(({ id, name, color }) => {
        return { name: id, message: getColor(color)(name) }
      }),
    })
    const template = currentTemplates.find(({ id }) => id === answer.id)!
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
