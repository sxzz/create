# @sxzz/create

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

Command-line for creating projects from templates.

## Install

```bash
npm i -g @sxzz/create

# Or use [p]npx
npx @sxzz/create
```

## Usage

### Create a project

```bash
create [path]
# e.g: create hello-world
```

### Edit configuration

```bash
# edit the configuration via VSCode, Vim, or Zed.
create edit
```

### Use remote configuration

```bash
create from <url>
# e.g: create from https://raw.githubusercontent.com/sxzz/create/main/example.yaml

# or for short
create from <owner>/<repo>/<branch>/<path>
# e.g: create from sxzz/create/main/example.yaml
```

## Configuration

Most formats of configuration are supported.
The configuration file is located in `$HOME/.config/create.config.[js,mjs,ts,mts,json,yml,yaml]`

[TypeScript Schema](https://github.com/sxzz/create/blob/main/src/types.ts)

URL format: `repo[/subpath][#ref]`. See [examples](https://github.com/unjs/giget#examples).

Run `create config` to modify config.

```yaml
cwd: /Users/your-name/projects # optional, defaults to process.cwd()

git:
  init: true # optional, defaults to true
  add: false

templates:
  - name: Library # must be unique
    # color: '#008800' # optional
    children:
      - name: TypeScript
        color: '#3178c6'
        url: sxzz/node-lib-starter # remote URL or local path
  - name: Web App
    url: xxxxx
    git:
      init: false # overwrite global config
```

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/sxzz/sponsors/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/sxzz/sponsors/sponsors.svg'/>
  </a>
</p>

## Credits

- [kecrily/create](https://github.com/kecrily/create) 💖

## License

[MIT](./LICENSE) License © 2022-PRESENT [Kevin Deng](https://github.com/sxzz)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@sxzz/create.svg
[npm-version-href]: https://npmjs.com/package/@sxzz/create
[npm-downloads-src]: https://img.shields.io/npm/dm/@sxzz/create
[npm-downloads-href]: https://www.npmcharts.com/compare/@sxzz/create?interval=30
