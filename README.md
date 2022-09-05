# @sxzz/create [![npm](https://img.shields.io/npm/v/@sxzz/create.svg)](https://npmjs.com/package/@sxzz/create)

Command-line for creating projects from templates.

## Install

```bash
npm i -g @sxzz/create
```

## Configuration

The configuration file is located in `$HOME/.config/create-templates.yml`

[TypeScript Schema](https://github.com/sxzz/create/blob/main/src/template.ts#L7-L13)

```yaml
- id: lib # An unique id
  name: Library
  # color: '#008800' # optional
  children:
    - id: ts
      name: TypeScript
      color: '#3178c6'
      url: 'git@github.com:sxzz/node-lib-starter.git' # remote URL or local path
- id: webapp
  name: Web App
  url: xxxxx
```

## TODO

- modify name in `package.json` and `README.md`
- update deps

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/sxzz/sponsors/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/sxzz/sponsors/sponsors.svg'/>
  </a>
</p>

## Credits

- [create-kecrily](https://github.com/kecrily/create-kecrily) 💖

## License

[MIT](./LICENSE) License © 2022 [三咲智子](https://github.com/sxzz)
