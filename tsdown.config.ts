import { nodeLib } from 'tsdown-preset-sxzz'

export default nodeLib(
  {
    entry: ['./src/{index,cli}.ts'],
    inlineDeps: ['@antfu/utils', 'replace-in-file'],
  },
  {
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
  },
)
