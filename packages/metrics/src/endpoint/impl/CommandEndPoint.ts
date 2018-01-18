import {EndPoint} from '../EndPoint';
import {MetricsInjectionBridge} from '../../';
import {Facade} from 'pandora-hub';

class CommandSwitchStore {
  private commandStore = {};

  open(name) {
    this.commandStore[name] = true;
  }

  close(name) {
    this.commandStore[name] = false;
  }
}

export class CommandEndPoint extends EndPoint {
  group: string = 'command';
  ipcHub: Facade = MetricsInjectionBridge.getIPCHub();
  private commandStore = new CommandSwitchStore();

  async registerIndicator(data, reply, client) {
    super.registerIndicator(data, reply, client);
    await this.ipcHub.publish(this.commandStore, {
      name: 'commandStore'
    });
  }
}
