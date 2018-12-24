import {componentName, dependencies} from 'pandora-component-decorator';

@componentName('processInfo')
@dependencies(['indicator'])
export default class ComponentProcessInfo {

  ctx: any;
  constructor(ctx: any) {
    this.ctx = ctx;
  }

  async startAtSupervisor() {
    await this.startAtProcesses();
  }

  async start() {
    await this.startAtProcesses();
  }

  async startAtProcesses() {
  }

}

export * from './ProcessIndicator';
