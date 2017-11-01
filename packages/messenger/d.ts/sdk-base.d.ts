declare module 'sdk-base' {
  import {EventEmitter} from 'events';
  class Base extends EventEmitter {
    protected defaultErrorHandler(err: any);
    ready(param: boolean | Function);
    ready(): Promise<void>;
  }
  export = Base;
}
