import * as fs from 'fs'
import * as path from 'path'
import * as program from 'commander'
import { format } from 'prettier'

import { generateCode } from './generate'
import { loadYAML } from './utils'

const PACKAGE = require('../../package.json')

/*
 * TODO
 *   - support custom file name
 *   - support custom output dir
 *   - validate routes
 *   - add credit to output files
 *   - log each steps
 *   - support more path-to-regexp's syntax
 *   - export params type
 *   - warning when occur unsupported path-to-regexp syntax
 *   - warning when yaml file has invalid variable, eg: `routers:` is invalid
 * */

program
  .version(PACKAGE.version)
  .usage('<file...> [options]')
  .option('-P, --prettier [path]', 'specify the config path of Prettier')

program.action((...args) => {
  args.forEach((arg) => {
    const isRoutePath = typeof arg === 'string'

    if (isRoutePath) {
      generateFile(arg)
    }
  })
})

program.parse(process.argv)

function generateFile(routePath: string) {
  const yamlString = fs.readFileSync(path.resolve(routePath), { encoding: 'utf-8' })
  const { routes, options } = loadYAML(yamlString)
  const codeString = generateCode(routes, options.variableName)

  const outputDir = path.dirname(routePath)
  const outputName = `${path.basename(routePath, path.extname(routePath))}.ts`
  const outputPath = path.join(outputDir, outputName)

  fs.writeFileSync(outputPath, prettifyCode(codeString))
}

function prettifyCode(codeString: string): string {
  try {
    const prettierOptions =
      typeof program.prettier === 'string'
        ? JSON.parse(fs.readFileSync(path.resolve(program.prettier), { encoding: 'utf-8' }))
        : {}

    return format(codeString, { ...prettierOptions, parser: 'typescript' })
  } catch (e) {
    console.error(e)
  }

  return codeString
}
