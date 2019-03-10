import { compile, PathFunctionOptions } from 'path-to-regexp'

type PathMaker<Params, Required extends boolean> = Required extends true
  ? (paramsMap: Params, options?: PathFunctionOptions) => string
  : (paramsMap?: Params, options?: PathFunctionOptions) => string

export type Params<K extends string, V = string | number> = { [key in K]: V }

export type RepeatParams<K extends string, V = string | number> = Params<K, V[]>

export enum ParamsType {
  Params = 'Params',
  RepeatParams = 'RepeatParams',
}

export function makePathsFrom<Params = void>(path: string) {
  // https://github.com/pillarjs/path-to-regexp#compile-reverse-path-to-regexp
  return compile(path) as PathMaker<Params, Params extends void ? false : true>
}
