import { set } from 'lodash'

import { Routes, VariableName } from './types'
import { recursiveForEach, convert, codeStringify } from './utils'

interface ParseResult {
  staticRoute: { [key: string]: object | string }
  routeFactory: { [key: string]: object | string }
  ParamsInterface: { [key: string]: object | string }
}

export function generateCode(routes: Routes, variableName: VariableName): string {
  const { staticRoute, routeFactory, ParamsInterface } = parse(routes, variableName)

  return `
import { makePathsFrom, Params, RepeatParams } from "typed-route-generator"

export interface ${variableName.ParamsInterface} ${codeStringify(ParamsInterface)}

export const ${variableName.staticRoute} = ${codeStringify(staticRoute)};

export const ${variableName.routeFactory} = ${codeStringify(routeFactory)};`
}

function parse(routes: Routes, variableName: VariableName): ParseResult {
  const result: ParseResult = { ParamsInterface: {}, staticRoute: {}, routeFactory: {} }

  recursiveForEach(routes, (pathString, currentRefPath) => {
    const { path, paramsType } = convert(pathString)
    const pathRef = [variableName.staticRoute, ...currentRefPath].join('.')
    const paramsRef = [variableName.ParamsInterface, ...currentRefPath].reduce(
      (ref, nextPath) => `${ref}['${nextPath}']`,
    )

    set(result.ParamsInterface, currentRefPath, paramsType || 'void')
    set(result.staticRoute, currentRefPath, `'${path}'`)
    set(result.routeFactory, currentRefPath, `makePathsFrom<${paramsRef}>(${pathRef})`)
  })

  return result
}
