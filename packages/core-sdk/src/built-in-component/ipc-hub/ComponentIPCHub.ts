import {componentName} from 'pandora-component-decorator';
import {IPCHub} from './IPCHub';

@componentName('ipcHub')
export default class ComponentIPCHub {

  ctx: any;
  ipcHub: IPCHub = new IPCHub;
  constructor(ctx) {
    ctx.ipcHub = this.ipcHub;
    this.ctx = ctx;
  }

  async startAtSupervisor() {
    console.log('>>>>>>> Start IPC Hub Server at Supervisor');
  }

  async start() {
    console.log('>>>>>>> Start IPC Hub Server at worker');
  }

}