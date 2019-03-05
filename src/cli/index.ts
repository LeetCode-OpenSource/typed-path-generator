import * as fs from 'fs'
import * as path from 'path'
import * as program from 'commander'
import { format } from 'prettier'

import { generateCode, parse } from './generate'

const PACKAGE = require('../../package.json')

/*
 * TODO
 *   - support custom file name
 *   - support custom output dir
 *   - support custom export variable name, eg: rename `export path = ...` to `export PATH = ...`
 *   - support recursive file path syntax to generate multiple files
 *   - validate routes
 *   - add credit to output files
 *   - log each steps
 * */

program
  .version(PACKAGE.version)
  .option('-P, --prettier [path]', 'specify the config path of Prettier')

program.command('*').action((routerPath) => {
  const yamlString = fs.readFileSync(path.resolve(routerPath), { encoding: 'utf-8' })
  const codeString = generateCode(parse(yamlString))

  const outputDir = path.dirname(routerPath)
  const outputName = `${path.basename(routerPath, path.extname(routerPath))}.ts`

  fs.writeFileSync(path.join(outputDir, outputName), prettifyCode(codeString))
})

program.parse(process.argv)

function prettifyCode(codeString: string): string {
  if (program.prettier) {
    try {
      const prettierOptions =
        typeof program.prettier === 'string'
          ? JSON.parse(fs.readFileSync(path.resolve(program.prettier), { encoding: 'utf-8' }))
          : {}

      return format(codeString, { ...prettierOptions, parser: 'typescript' })
    } catch (e) {
      console.error(e)
    }
  }

  return codeString
}
