[![Logo](./logo.png)](https://fbw.vigneshprasad.com)

## Watch directories for changes and run commands.<a name="README"></a>

[Github](https://github.com/ViGi-P/fuzz-barnacle-watch)

### Installation

1. Install [watchman](https://facebook.github.io/watchman/).
2. Install [@vigi-p/fbw](https://www.npmjs.com/package/@vigi-p/fbw) - `npm install --global @vigi-p/fbw`.

### Usage

- `fbw --target=src --run='echo changed' --target=./src --run='echo another' --ignore='src/db.json, src/mockData.js'`.
- `fbw sync -t=src -r='echo src:1' -t=dist -r='echo dist:1' -t=src -r='echo src:2' -t=dist -r='echo dist:2'`.
- Help - `fbw --help`.

### Documentation

Generated documentation [here](https://ViGi-P.github.io/fuzz-barnacle-watch/docs).

### Known bugs

- Unintended behaviour when passing some npm scripts as commands. To avoid such cases, call fbw from npm instead of calling npm from fbw 🙆‍♂️.

### LICENSE

MIT License

Copyright (c) 2020 Vignesh Prasad

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
