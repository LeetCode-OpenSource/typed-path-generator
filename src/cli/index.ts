import * as fs from 'fs'
import * as path from 'path'
import program from 'commander'
import glob from 'glob'
import outdent from 'outdent'
import chalk from 'chalk'
import { format, resolveConfig } from 'prettier'

import { YAML } from './types'
import { Logger, LoggerStatus } from './logger'
import { generateCode } from './generate'
import { loadYAML } from './utils'

const PACKAGE = require('../../package.json')

/*
 * TODO
 *   - support custom file name
 *   - support custom output dir
 *   - validate paths
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
  const filePaths = await getFilePaths()
  await Promise.all(filePaths.map((filePath) => generateFile(filePath)))
}

async function getFilePaths(): Promise<string[]> {
  const globProcess: (string[])[] = await Promise.all(
    program.args.map(
      (arg) =>
        new Promise<string[]>((resolve) => {
          const isFilePath = typeof arg === 'string'

          if (isFilePath) {
            glob(arg, (error, fileNames) => {
              if (error) {
                console.warn(error)
                resolve([])
              } else {
                resolve(fileNames)
              }
            })
          } else {
            resolve([])
          }
        }),
    ),
  )

  return globProcess.reduce((result, fileNames) => [...result, ...fileNames])
}

async function generateFile(filePath: string) {
  await generateTypeScriptFile(filePath, parseYAML(filePath))
}

function parseYAML(filePath: string): YAML {
  const logger = new Logger(filePath)

  logger.log(`Parse ${chalk.underline(filePath)}`, LoggerStatus.Started)

  const yamlString = fs.readFileSync(path.resolve(filePath), { encoding: 'utf-8' })
  const result = loadYAML(yamlString)

  logger.log(`Parse ${chalk.underline(filePath)}`, LoggerStatus.Completed)

  return result
}

async function generateTypeScriptFile(filePath: string, { paths, options }: YAML) {
  const logger = new Logger(filePath)

  const outputDir = path.dirname(filePath)
  const outputName = `${path.basename(filePath, path.extname(filePath))}.ts`
  const outputPath = path.join(outputDir, outputName)

  logger.log(`Generate ${chalk.underline(outputPath)}`, LoggerStatus.Started)

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

  logger.log(`Generate ${chalk.underline(outputPath)}`, LoggerStatus.Completed)
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
