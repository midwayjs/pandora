import {IReporter} from './types';
const debug = require('debug')('pandora:reporter-manager:ReporterManager');

export class ReporterManager {
  registration: Map<string, IReporter> = new Map;
  async dispatch(type: string, data: any) {
    for(const reporter of this.registration.values()) {
      if(reporter.type === type) {
        try {
          await reporter.report(data);
        } catch(err) {
          debug(err);
        }
      }
    }
  }
  register(name: string, reporter: IReporter) {
    this.registration.set(name, reporter);
  }
}
