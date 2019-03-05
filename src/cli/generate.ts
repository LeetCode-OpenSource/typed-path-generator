import { safeLoad } from 'js-yaml'
import { set } from 'lodash'

import { recursiveForEach, convert, stringify } from './utils'

interface ParseResult {
  path: { [key: string]: object | string }
  to: { [key: string]: object | string }
}

export function parse(yamlString: string): ParseResult {
  const yamlObject = safeLoad(yamlString)
  const result: ParseResult = {
    path: {},
    to: {},
  }

  recursiveForEach(yamlObject, (pathString, currentRefPath) => {
    const { path, paramsType } = convert(pathString)
    const pathRef = `path.${currentRefPath.join('.')}`

    set(result.path, currentRefPath, `'${path}'`)
    set(result.to, currentRefPath, `makePathsFrom<${paramsType}>(${pathRef})`)
  })

  return result
}

export function generateCode({ path, to }: ParseResult): string {
  return `
import { makePathsFrom, Params } from "typed-route-generator"

export const path = ${stringify(path)};

export const to = ${stringify(to)};`
}
