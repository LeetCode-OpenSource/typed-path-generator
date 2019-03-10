export interface YAML {
  paths: Paths
  options: Options
}

export interface Paths {
  [key: string]: string | Paths
}

export interface Options {
  variableName: VariableName
}

export interface VariableName {
  staticPath: string
  pathFactory: string
  ParamsInterface: string
}
