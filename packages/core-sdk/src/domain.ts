export interface ICoreSDKOptions {
  mode: string;
}

export interface IComponent {
  start(): Promise<void>;
  startAtSupervisor(): Promise<void>;
}

export interface IComponentConstructor {
  new(ctx: any): IComponent;
}

export interface IComponentDeclaration {
  name: string;
  path: string;
  dependencies?: string[];
  klass?: IComponentConstructor;
}

export interface IComponentDeclarationStrict extends IComponentDeclaration {
  dependencies: string[];
  klass: IComponentConstructor;
}
