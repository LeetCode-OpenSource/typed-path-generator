import * as fs from 'fs'
import * as path from 'path'
import * as program from 'commander'
import { format, resolveConfig } from 'prettier'

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
 *   - warning when yaml file has invalid variable, eg: `routers:` is invalid
 *   - better type checking for custom Matching Parameters, eg:
 *      - /:foo(\\d+) could be Params<foo, number>
 *      - /:foo(one|two) could be Params<'foo', 'one' | 'two'>
 * */

program
  .version(PACKAGE.version)
  .usage('<file...> [options]')
  .option('-P, --prettier [path]', 'specify the config path of Prettier')

program.parse(process.argv)

main()

async function main() {
  await Promise.all(
    program.args.map(async (arg) => {
      const isRoutePath = typeof arg === 'string'

      if (isRoutePath) {
        await generateFile(arg)
      }
    }),
  )
}

async function generateFile(routePath: string) {
  const yamlString = fs.readFileSync(path.resolve(routePath), { encoding: 'utf-8' })
  const { routes, options } = loadYAML(yamlString)
  const codeString = generateCode(routes, options.variableName)

  const outputDir = path.dirname(routePath)
  const outputName = `${path.basename(routePath, path.extname(routePath))}.ts`
  const outputPath = path.join(outputDir, outputName)

  fs.writeFileSync(outputPath, await prettifyCode(codeString))
}

async function prettifyCode(codeString: string): Promise<string> {
  if (typeof program.prettier === 'string') {
    try {
      const config = await resolveConfig(program.prettier)
      return format(codeString, { ...config, parser: 'typescript' })
    } catch (e) {
      console.error(e)
    }
  }

  return format(codeString, { parser: 'typescript' })
}
