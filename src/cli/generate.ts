import { set } from 'lodash'
import outdent from 'outdent'

import { Routes, VariableName } from './types'
import { recursiveForEach, convert, codeStringify, getDefaultOptions } from './utils'

interface ParseResult {
  staticRoute: { [key: string]: object | string }
  routeFactory: { [key: string]: object | string }
  ParamsInterface: { [key: string]: object | string }
}

// using default variable name to avoid conflict with custom variable name,
// and the custom one is only used for export
const VARIABLE_NAME = getDefaultOptions().variableName

export function generateCode(routes: Routes, variableName: VariableName): string {
  const { staticRoute, routeFactory, ParamsInterface } = parse(routes)

  return outdent`
    import { makePathsFrom, Params, RepeatParams } from "typed-route-generator"

    interface ${VARIABLE_NAME.ParamsInterface} ${codeStringify(ParamsInterface)}

    const ${VARIABLE_NAME.staticRoute} = ${codeStringify(staticRoute)};

    const ${VARIABLE_NAME.routeFactory} = ${codeStringify(routeFactory)};

    export {
      ${VARIABLE_NAME.ParamsInterface} as ${variableName.ParamsInterface},
      ${VARIABLE_NAME.staticRoute} as ${variableName.staticRoute},
      ${VARIABLE_NAME.routeFactory} as ${variableName.routeFactory},
    }
  `
}

function parse(routes: Routes): ParseResult {
  const result: ParseResult = { ParamsInterface: {}, staticRoute: {}, routeFactory: {} }

  recursiveForEach(routes, (pathString, currentRefPath) => {
    const { path, paramsType } = convert(pathString)
    const pathRef = [VARIABLE_NAME.staticRoute, ...currentRefPath].join('.')
    const paramsRef = [VARIABLE_NAME.ParamsInterface, ...currentRefPath].reduce(
      (ref, nextPath) => `${ref}['${nextPath}']`,
    )

    set(result.ParamsInterface, currentRefPath, paramsType || 'void')
    set(result.staticRoute, currentRefPath, `'${path}'`)
    set(result.routeFactory, currentRefPath, `makePathsFrom<${paramsRef}>(${pathRef})`)
  })

  return result
}
