export interface Template {
  id: string
  name: string
  color?: string
  children?: Template[]
  url?: string
}

export const templates: Template[] = [
  {
    id: 'lib',
    name: 'Library',
    children: [
      {
        id: 'ts',
        name: 'TypeScript',
        color: '#3178c6',
        url: 'git@github.com:sxzz/node-lib-starter.git',
      },
    ],
  },
]
