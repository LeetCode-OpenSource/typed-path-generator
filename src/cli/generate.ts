import { set } from 'lodash'
import outdent from 'outdent'

import { Paths, VariableName } from './types'
import {
  recursiveForEach,
  convert,
  codeStringify,
  getDefaultOptions,
  mergeTypeString,
  ParamsTypeString,
} from './utils'

interface ImportInfo {
  // `true` if below variable is used
  makePathsFrom?: boolean
  Params?: boolean
  RepeatParams?: boolean
}

interface ParseResult {
  staticPath: { [key: string]: object | string }
  pathFactory: { [key: string]: object | string }
  ParamsInterface: { [key: string]: object | string }
  importInfo: ImportInfo
}

// using default variable name to avoid conflict with custom variable name,
// and the custom one is only used for export
const VARIABLE_NAME = getDefaultOptions().variableName

export function generateCode(paths: Paths, variableName: VariableName): string {
  const { staticPath, pathFactory, ParamsInterface, importInfo } = parse(paths)
  const usedImportKeys = Object.keys(importInfo).filter(
    (key) => !!importInfo[key as keyof ImportInfo],
  )
  const importString =
    usedImportKeys.length > 0
      ? `import { ${usedImportKeys.join(',')} } from "typed-path-generator"`
      : ''

  return outdent`
    ${importString}

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
  const result: ParseResult = {
    ParamsInterface: {},
    staticPath: {},
    pathFactory: {},
    importInfo: {},
  }

  recursiveForEach(paths, (pathString, currentRefPath) => {
    const { path, paramsTypeString } = convert(pathString)

    const mergedParamsType = mergeTypeString(...Object.values(paramsTypeString))
    const pathRef = [VARIABLE_NAME.staticPath, ...currentRefPath].join('.')
    const paramsRef = [VARIABLE_NAME.ParamsInterface, ...currentRefPath].reduce(
      (ref, nextPath) => `${ref}['${nextPath}']`,
    )

    updateImportInfo(paramsTypeString)
    set(result.ParamsInterface, currentRefPath, mergedParamsType || 'void')
    set(result.staticPath, currentRefPath, `'${path}'`)
    set(result.pathFactory, currentRefPath, `makePathsFrom<${paramsRef}>(${pathRef})`)
  })

  return result

  function updateImportInfo({
    required,
    requiredRepeat,
    optional,
    optionalRepeat,
  }: ParamsTypeString) {
    const { importInfo } = result

    importInfo.makePathsFrom = true

    const isUsedParamsType = !!(required || optional)
    if (isUsedParamsType && !importInfo.Params) {
      importInfo.Params = true
    }

    const isUsedRepeatParamsType = !!(requiredRepeat || optionalRepeat)
    if (isUsedRepeatParamsType && !importInfo.RepeatParams) {
      importInfo.RepeatParams = true
    }
  }
}
