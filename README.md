# fuzz-barnacle-watch (fbw) <a name="README"></a>

Watch directories for changes and run commands.

## Installation

1. Install [watchman](https://facebook.github.io/watchman/).
2. Run `npm install --global @vigi-p/fbw`.

## Usage

- `fbw --target=src --run='echo changed' --target=./src --run='echo another' --ignore='src/db.json, src/mockData.js'`.
- `fbw sync -t=src -r='echo src:1' -t=dist -r='echo dist:1' -t=src -r='echo src:2' -t=dist -r='echo dist:2'`.
- Help - `fbw --help`.

## Known bugs

- Unintended behaviour when passing npm scripts as commands. To avoid such cases, call fbw within npm instead of calling npm within fbw.
