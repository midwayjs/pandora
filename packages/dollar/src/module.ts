import NodeJSModule = require('module');

export interface DollarModule extends NodeJSModule {
  new (path: string);
  _extensions: string[];
}

export const Module = (NodeJSModule as unknown) as DollarModule;
