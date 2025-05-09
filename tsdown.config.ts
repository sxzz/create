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
})
