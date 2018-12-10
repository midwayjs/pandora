export interface IEndPoint {
  prefix: string;
  aliasPrefix?: Array<string>;
  route(router);
}