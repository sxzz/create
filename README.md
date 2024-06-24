# @sxzz/create [![npm](https://img.shields.io/npm/v/@sxzz/create.svg)](https://npmjs.com/package/@sxzz/create)

Command-line for creating projects from templates.

## Install

```bash
npm i -g @sxzz/create
```

## Usage

```bash
create [path]
# e.g: create hello-world
```

## Configuration

Most formats of configuration are supported.
The configuration file is located in `$HOME/.config/create.config.[js,mjs,ts,mts,json,yml,yaml]`

[TypeScript Schema](https://github.com/sxzz/create/blob/main/src/types.ts)

URL format: `repo[/subpath][#ref]`. See [examples](https://github.com/unjs/giget#examples).

Run `create config` to modify config.

```yaml
git:
  init: true # optional, defaults to true

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

[MIT](./LICENSE) License © 2022-PRESENT [三咲智子](https://github.com/sxzz)
