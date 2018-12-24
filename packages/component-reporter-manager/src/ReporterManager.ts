import {IReporter} from './doamin';

export class ReporterManager {
  registration: Map<string, IReporter> = new Map;
  async dispatch(type: string, data: any) {
    for(const reporter of this.registration.values()) {
      if(reporter.type === type) {
        await reporter.report(data);
      }
    }
  }
  register(name: string, reporter: IReporter) {
    this.registration.set(name, reporter);
  }
}