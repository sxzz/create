import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/{index,cli}.ts'],
  format: ['esm'],
  target: 'node18',
  clean: true,
  dts: true,
  bundleDts: { resolve: ['@antfu/utils'] },
  unused: { level: 'error' },
})
