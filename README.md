<h1 align="center">🏇 typed-path-generator</h1>
<p align="center">Convert path <code>/user/:userID</code> to <code>(params: { userID: string | number }) => string</code></p>
<p align="center">
  <a href="https://github.com/LeetCode-OpenSource/typed-path-generator/blob/master/LICENSE">
    <img alt="GitHub license" src="https://img.shields.io/badge/license-MIT-blue.svg">
  </a>
  <a href="https://github.com/LeetCode-OpenSource/typed-path-generator/pulls">
    <img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg">
  </a>
  <a href="https://github.com/prettier/prettier">
    <img alt="code style: prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat">
  </a>
  <a href="https://www.npmjs.com/package/typed-path-generator">
    <img alt="npm version" src="https://img.shields.io/npm/v/typed-path-generator.svg?style=flat">
  </a>
</p>

With [Typescript](https://typescriptlang.org/), handling [path parameters](https://github.com/pillarjs/path-to-regexp#parameters) could be very frustrating. Because there is no type checking for path parameters which is only a `string` type, we have to define it manually in an error-prone way. To free us from those work, `typed-path-generator` was created. By pre-processing the path string, `typed-path-generator` will extract the type info from path parameters and generate a well defined Typescript file.

## Quick Start

### Install

using [yarn](https://yarnpkg.com/):

```bash
yarn add typed-path-generator
```

or via [npm](https://docs.npmjs.com):

```bash
npm install typed-path-generator
```

### Config paths

`typed-path-generator` using [YAML](https://yaml.org) as configuration file. Here's an example:

```yaml
options:
  variableName:
    # Used to customize the export variables of generated file.
    # import { path, to } from './generated-file.ts'

    # Optional, default is `staticPath`
    staticPath: path
    # Optional, default is `pathFactory`
    pathFactory: to
    # Optional, default is `ParamsInterface`
    ParamsInterface: Params

paths:
  # type URL = string // any valid URL path that path-to-regexp understands. see https://github.com/pillarjs/path-to-regexp for more details.
  # interface Paths {
  #   [key: string]: URL | Paths
  # }
  user: /user/:userID
  settings:
    emails: /settings/emails
  discuss:
    list: /discuss
    detail: /discuss/:discussID
```

### Generate code

run `typed-path-generator` to generate a relative typescript file:

```bash
typed-path-generator ./your-config-file.yaml
```

furthermore, you can use **[glob patterns](<https://en.wikipedia.org/wiki/Glob_(programming)>)** to specify a group of configuration files:

```bash
typed-path-generator ./packages/**/route.yaml
```

##### Options:

```
  -V, --version          output the version number
  -P, --prettier [path]  specify the config path of Prettier
  -h, --help             output usage information
```
