declare module 'sdk-base' {
  import {EventEmitter} from 'events';
  export = class Base extends EventEmitter {
    protected defaultErrorHandler(err: any);
    ready(param: boolean | Function);
  };
}
