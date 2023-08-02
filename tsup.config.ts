import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/{index,cli}.ts'],
  format: ['esm'],
  target: 'node16.14',
  clean: true,
  dts: true,
})
