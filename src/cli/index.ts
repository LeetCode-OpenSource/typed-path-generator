import * as fs from 'fs'
import * as path from 'path'
import * as program from 'commander'
import outdent from 'outdent'
import { format, resolveConfig } from 'prettier'

import { generateCode } from './generate'
import { loadYAML } from './utils'

const PACKAGE = require('../../package.json')

/*
 * TODO
 *   - support custom file name
 *   - support custom output dir
 *   - validate paths
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
      const isFilePath = typeof arg === 'string'

      if (isFilePath) {
        await generateFile(arg)
      }
    }),
  )
}

async function generateFile(filePath: string) {
  const yamlString = fs.readFileSync(path.resolve(filePath), { encoding: 'utf-8' })
  const { paths, options } = loadYAML(yamlString)

  const outputDir = path.dirname(filePath)
  const outputName = `${path.basename(filePath, path.extname(filePath))}.ts`
  const outputPath = path.join(outputDir, outputName)

  const codeString = await prettifyCode(outdent`
    /*
     * Please do not modify this file, because it was generated from file ${path.relative(
       outputDir,
       filePath,
     )}.
     * Check https://github.com/LeetCode-OpenSource/typed-path-generator for more details.
     * */

    ${generateCode(paths, options.variableName)}
  `)

  fs.writeFileSync(outputPath, codeString)
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
