import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src'],
  format: ['esm'],
  target: 'node14',
  clean: true,
  dts: true,
})
