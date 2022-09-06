# @sxzz/create [![npm](https://img.shields.io/npm/v/@sxzz/create.svg)](https://npmjs.com/package/@sxzz/create)

Command-line for creating projects from templates.

## Install

```bash
npm i -g @sxzz/create
```

## Usage

```bash
cd /some/path/projects
create
```

## Configuration

Most formats of configuration are supported.
The configuration file is located in `$HOME/.config/create.config.[js,json,yml]`

[TypeScript Schema](https://github.com/sxzz/create/blob/main/src/template.ts#L12-L23)

Run `create config` to modify config.

```yaml
gitInit: true # optional, defaults to true

templates:
  - name: Library # must be unique
    # color: '#008800' # optional
    children:
      - name: TypeScript
        color: '#3178c6'
        url: 'git@github.com:sxzz/node-lib-starter.git' # remote URL or local path
  - name: Web App
    url: xxxxx
    gitInit: false # overwrite global config
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
