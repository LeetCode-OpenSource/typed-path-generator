export interface YAML {
  routes: Routes
  options: Options
}

export interface Routes {
  [key: string]: string | Routes
}

export interface Options {
  variableName: VariableName
}

export interface VariableName {
  staticRoute: string
  routeFactory: string
}
