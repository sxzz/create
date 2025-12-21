import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: './src/{index,cli}.ts',
  dts: {
    resolve: ['@antfu/utils', 'replace-in-file'],
  },
  unused: {
    level: 'error',
    ignore: ['tinyglobby'],
  },
  plugins: [
    {
      name: 'alias',
      resolveId(id) {
        if (id === 'glob') {
          return { id: 'tinyglobby', external: true }
        }
        if (id === 'chalk') {
          return { id: 'ansis', external: true }
        }
      },
    },
  ],
  exports: true,
  inlineOnly: ['@antfu/utils', 'replace-in-file'],
})
