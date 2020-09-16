# fuzz-barnacle-watch (fbw) <a name="README"></a>

Watch directories for changes and run commands.

## Installation

1. Install [watchman](https://facebook.github.io/watchman/).
2. Run `npm install --global @vigi-p/fbw`.

## Usage

- `fbw --target relative_path/to/directory --command "echo changed" -t relative_path/to/another_directory -c "echo modified"`.
- Help - `fbw --help`.
