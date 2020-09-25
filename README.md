![Logo](./logo.png)

## Watch directories for changes and run commands.<a name="README"></a>

### Installation

1. Install [watchman](https://facebook.github.io/watchman/).
2. Install [@vigi-p/fbw](https://www.npmjs.com/package/@vigi-p/fbw)
   - `npm install --global @vigi-p/fbw`.

### Usage

- `fbw --target=src --run='echo changed' --target=./src --run='echo another' --ignore='src/db.json, src/mockData.js'`.
- `fbw sync -t=src -r='echo src:1' -t=dist -r='echo dist:1' -t=src -r='echo src:2' -t=dist -r='echo dist:2'`.
- Help - `fbw --help`.

### Documentation

Typedoc generated documentation [here](https://ViGi-P.github.io/fuzz-barnacle-watch/docs).

### Known bugs

- Unintended behaviour when passing npm scripts as commands. To avoid such cases, call fbw from npm instead of calling npm from fbw 🙆‍♂️.
