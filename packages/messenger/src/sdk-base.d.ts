declare module 'sdk-base' {
  import { EventEmitter } from 'events';
  class Base extends EventEmitter {
    protected defaultErrorHandler(err: any);
    ready(param: boolean | (() => void));
    ready(): Promise<void>;
    _ready: boolean;
  }
  export = Base;
}
