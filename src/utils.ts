import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ansis from 'ansis'
import { execa } from 'execa'
import { findUp } from 'find-up-simple'
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

export function getColor(color?: string): (text: string) => string {
  if (!color) return (v) => v
  else if (isColor(color)) return ansis[color]
  else if (color.startsWith('#')) return ansis.hex(color)
  throw new Error(`Unknown color: ${color}`)
}

export async function which(command: string): Promise<number> {
  try {
    const { exitCode } = await execa('which', [command])
    return exitCode!
  } catch (error: any) {
    return error.exitCode
  }
}

export async function cmdExists(command: string): Promise<boolean> {
  const code = await which(command)
  return code === 0
}

export async function findConfigTypePath(): Promise<string> {
  const filename = fileURLToPath(import.meta.url)
  const pkgPath = path.dirname(
    (await findUp('package.json', { cwd: filename }))!,
  )
  return pkgPath
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

export class CliError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CliError'
  }
}
