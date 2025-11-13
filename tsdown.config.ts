import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: './src/{index,cli}.ts',
  dts: {
    resolve: ['@antfu/utils', 'replace-in-file'],
  },
  unused: { level: 'error' },
  alias: {
    chalk: 'ansis',
  },
  exports: true,
  inlineOnly: [
    '@antfu/utils',
    'replace-in-file',
    'chalk',
    'glob',
    'minimatch',
    'brace-expansion',
    'path-scurry',
    'minipass',
    'balanced-match',
    'lru-cache',
  ],
})
