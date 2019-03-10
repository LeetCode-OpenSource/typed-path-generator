import { merge } from 'lodash'
import { safeLoad } from 'js-yaml'
import * as pathToRegexp from 'path-to-regexp'

import { ParamsType } from '../router-utils'
import { Options, YAML } from './types'

const getDefaultOptions = (): Options => ({
  variableName: {
    staticRoute: 'staticRoute',
    routeFactory: 'routeFactory',
  },
})

const makeParamsTypeString = makeTypeString(ParamsType.Params)

const makeRepeatParamsTypeString = makeTypeString(ParamsType.RepeatParams)

export function loadYAML(yaml: string): YAML {
  const { routes = {}, options = {} } = safeLoad(yaml)

  return {
    routes,
    options: merge(getDefaultOptions(), options),
  }
}

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
  const { requiredKeys, requiredRepeatKeys, optionalKeys, optionalRepeatKeys } = keys.reduce<{
    requiredKeys: pathToRegexp.Key[]
    requiredRepeatKeys: pathToRegexp.Key[]
    optionalKeys: pathToRegexp.Key[]
    optionalRepeatKeys: pathToRegexp.Key[]
  }>(
    ({ requiredKeys, requiredRepeatKeys, optionalKeys, optionalRepeatKeys }, key) => {
      if (key.optional) {
        if (key.repeat) {
          optionalRepeatKeys.push(key)
        } else {
          optionalKeys.push(key)
        }
      } else {
        if (key.repeat) {
          requiredRepeatKeys.push(key)
        } else {
          requiredKeys.push(key)
        }
      }

      return { requiredKeys, requiredRepeatKeys, optionalKeys, optionalRepeatKeys }
    },
    {
      requiredKeys: [],
      requiredRepeatKeys: [],
      optionalKeys: [],
      optionalRepeatKeys: [],
    },
  )

  const required = makeParamsTypeString(requiredKeys)
  const requiredRepeat = makeRepeatParamsTypeString(requiredRepeatKeys)

  const optional = partialTypeString(makeParamsTypeString(optionalKeys))
  const optionalRepeat = partialTypeString(makeRepeatParamsTypeString(optionalRepeatKeys))

  return mergeTypeString(required, requiredRepeat, optional, optionalRepeat)
}

function partialTypeString(type: string) {
  if (type) {
    return `Partial<${type}>`
  } else {
    return type
  }
}

function makeTypeString(Type: ParamsType) {
  return (keys: pathToRegexp.Key[]) => {
    if (keys.length < 1) {
      return ''
    } else {
      const withSingleQuote = (key: pathToRegexp.Key) => `'${key.name}'`
      return `${Type}<${keys.map(withSingleQuote).join(' | ')}>`
    }
  }
}

function mergeTypeString(...types: string[]) {
  return types.filter(Boolean).join(' & ')
}

export function stringify(code: object): string {
  return JSON.stringify(code).replace(/":"([^"]+)"/g, '":$1')
}
