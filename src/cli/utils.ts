import * as pathToRegexp from 'path-to-regexp'

export function recursiveForEach<Output>(
  obj: any,
  translate: (value: any, path: string[]) => Output,
  parentPath: string[] = [],
) {
  Object.keys(obj).forEach((key) => {
    const currentPath = [...parentPath, key]
    const value = obj[key]
    if (typeof value === 'object') {
      recursiveForEach(value, translate, currentPath)
    } else {
      translate(value, currentPath)
    }
  })
}

export function convert(pathString: string) {
  const keys: pathToRegexp.Key[] = []

  pathToRegexp(pathString, keys)

  return {
    path: pathString,
    paramsType: getParamsTypeString(keys),
  }
}

function getParamsTypeString(keys: pathToRegexp.Key[]) {
  const [requiredKey, optionalKey] = keys.reduce<[pathToRegexp.Key[], pathToRegexp.Key[]]>(
    ([required, optional], key) => {
      if (key.optional) {
        optional.push(key)
      } else {
        required.push(key)
      }

      return [required, optional]
    },
    [[], []],
  )

  const required = makeParamsTypeString(requiredKey)
  const optional = makeParamsTypeString(optionalKey)

  return mergeTypeString(required, optional && `Partial<${optional}>`)
}

function makeParamsTypeString(keys: pathToRegexp.Key[]) {
  if (keys.length < 1) {
    return ''
  }

  const withSingleQuote = (key: pathToRegexp.Key) => `'${key.name}'`

  return `Params<${keys.map(withSingleQuote).join(' | ')}>`
}

function mergeTypeString(...types: string[]) {
  return types.filter(Boolean).join(' & ')
}

export function stringify(code: object): string {
  return JSON.stringify(code).replace(/":"([^"]+)"/g, '":$1')
}
