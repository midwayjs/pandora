export interface IComponent {
  start?(): Promise<void>;
  startAtSupervisor?(): Promise<void>;
}

export interface IComponentConstructor {
  new(ctx: any): IComponent;
}
