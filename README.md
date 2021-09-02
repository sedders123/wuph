wuph
========

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/wuph.svg)](https://npmjs.org/package/wuph)
[![Downloads/week](https://img.shields.io/npm/dw/wuph.svg)](https://npmjs.org/package/wuph)
[![License](https://img.shields.io/npm/l/wuph.svg)](https://github.com/sedders123/wuph/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g wuph
$ wuph COMMAND
running command...
$ wuph (-v|--version|version)
wuph/0.1.0 win32-x64 node-v12.18.2
$ wuph --help [COMMAND]
USAGE
  $ wuph COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`wuph help [COMMAND]`](#wuph-help-command)
* [`wuph validate [DIR]`](#wuph-validate-dir)

## `wuph help [COMMAND]`

display help for wuph

```
USAGE
  $ wuph help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.3/src/commands/help.ts)_

## `wuph validate [DIR]`

validate wuph posts in the given directory

```
USAGE
  $ wuph validate [DIR]

OPTIONS
  -h, --help       show CLI help
  -r, --recurisve

EXAMPLE
  $ wuph validate posts/
```

_See code: [src/commands/validate.js](https://github.com/sedders123/wuph/blob/v0.1.0/src/commands/validate.js)_
<!-- commandsstop -->
