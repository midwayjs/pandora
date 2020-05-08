export interface IEndPoint {
  prefix: string;
  aliasPrefix?: Array<string>;
  route(router);
}

export interface IActuatorConfig {
  http: any;
}
