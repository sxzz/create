import { defineConfig } from 'tsup'
import Unused from 'unplugin-unused/esbuild'

export default defineConfig({
  entry: ['./src/{index,cli}.ts'],
  format: ['esm'],
  target: 'node18',
  clean: true,
  dts: true,
  esbuildPlugins: [Unused()],
})
