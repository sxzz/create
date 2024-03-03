import path from 'node:path'
import { fileURLToPath } from 'node:url'
import chalk, { type ChalkInstance } from 'chalk'
import { execa } from 'execa'
import { findUp } from 'find-up'
import type { Callbackable, Context } from './types'

export const COLORS = [
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'gray',
  'grey',
  'blackBright',
  'redBright',
  'greenBright',
  'yellowBright',
  'blueBright',
  'magentaBright',
  'cyanBright',
  'whiteBright',
  'bgBlack',
  'bgRed',
  'bgGreen',
  'bgYellow',
  'bgBlue',
  'bgMagenta',
  'bgCyan',
  'bgWhite',
  'bgGray',
  'bgGrey',
  'bgBlackBright',
  'bgRedBright',
  'bgGreenBright',
  'bgYellowBright',
  'bgBlueBright',
  'bgMagentaBright',
  'bgCyanBright',
  'bgWhiteBright',
] as const

const isColor = (color: string): color is (typeof COLORS)[number] =>
  COLORS.includes(color as any)

export function getColor(color?: string): ChalkInstance {
  if (!color) return chalk
  else if (isColor(color)) return chalk[color]
  else if (color.startsWith('#')) return chalk.hex(color)
  throw new Error(`Unknown color: ${color}`)
}

export async function which(command: string): Promise<number> {
  try {
    const { exitCode } = await execa('which', [command])
    return exitCode
  } catch (error: any) {
    return error.exitCode
  }
}

export async function findConfigTypePath() {
  const filename = fileURLToPath(import.meta.url)
  const pkgPath = path.dirname(
    (await findUp('package.json', { cwd: filename }))!,
  )
  return path.resolve(pkgPath, 'dist/types')
}

// eslint-disable-next-line require-await
export async function resolveCallbackable<T>(
  cb: Callbackable<T>,
  context: Context,
): Promise<T> {
  if (typeof cb === 'function') {
    return (cb as any)(context)
  }
  return cb
}

export function resolveCallbackables<T>(
  cbs: Callbackable<T>[],
  context: Context,
): Promise<T[]> {
  return Promise.all(cbs.map((cb) => resolveCallbackable(cb, context)))
}
