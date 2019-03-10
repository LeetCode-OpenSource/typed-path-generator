import { set } from 'lodash'
import outdent from 'outdent'

import { Paths, VariableName } from './types'
import { recursiveForEach, convert, codeStringify, getDefaultOptions } from './utils'

interface ParseResult {
  staticPath: { [key: string]: object | string }
  pathFactory: { [key: string]: object | string }
  ParamsInterface: { [key: string]: object | string }
}

// using default variable name to avoid conflict with custom variable name,
// and the custom one is only used for export
const VARIABLE_NAME = getDefaultOptions().variableName

export function generateCode(paths: Paths, variableName: VariableName): string {
  const { staticPath, pathFactory, ParamsInterface } = parse(paths)

  return outdent`
    import { makePathsFrom, Params, RepeatParams } from "typed-path-generator"

    interface ${VARIABLE_NAME.ParamsInterface} ${codeStringify(ParamsInterface)}

    const ${VARIABLE_NAME.staticPath} = ${codeStringify(staticPath)};

    const ${VARIABLE_NAME.pathFactory} = ${codeStringify(pathFactory)};

    export {
      ${VARIABLE_NAME.ParamsInterface} as ${variableName.ParamsInterface},
      ${VARIABLE_NAME.staticPath} as ${variableName.staticPath},
      ${VARIABLE_NAME.pathFactory} as ${variableName.pathFactory},
    }
  `
}

function parse(paths: Paths): ParseResult {
  const result: ParseResult = { ParamsInterface: {}, staticPath: {}, pathFactory: {} }

  recursiveForEach(paths, (pathString, currentRefPath) => {
    const { path, paramsType } = convert(pathString)
    const pathRef = [VARIABLE_NAME.staticPath, ...currentRefPath].join('.')
    const paramsRef = [VARIABLE_NAME.ParamsInterface, ...currentRefPath].reduce(
      (ref, nextPath) => `${ref}['${nextPath}']`,
    )

    set(result.ParamsInterface, currentRefPath, paramsType || 'void')
    set(result.staticPath, currentRefPath, `'${path}'`)
    set(result.pathFactory, currentRefPath, `makePathsFrom<${paramsRef}>(${pathRef})`)
  })

  return result
}
