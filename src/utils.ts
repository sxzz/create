import chalk from 'chalk'
import type { ChalkInstance } from 'chalk'

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

const isColor = (color: string): color is typeof COLORS[number] =>
  COLORS.includes(color as any)

export function getColor(color?: string): ChalkInstance {
  if (!color) return chalk
  else if (isColor(color)) return chalk[color]
  else if (color.startsWith('#')) return chalk.hex(color)
  throw new Error(`Unknown color: ${color}`)
}
