import { componentName, dependencies } from '@pandorajs/component-decorator';
import { HubServer } from '@pandorajs/hub';
import { PandoraMetric } from '@pandorajs/semantic-conventions';

@componentName('deadCounter')
@dependencies(['ipcHub', 'metric'])
export default class ComponentDeadCounter {
  constructor(private ctx) {}

  async startAtSupervisor() {
    const counter = this.ctx.meterProvider
      .getMeter('pandora')
      .createCounter(PandoraMetric.CLIENT_DISCONNECTED)
      .bind({});
    const hubServer: HubServer = this.ctx.hubServer;
    hubServer.on('client_disconnected', () => {
      counter.add(1);
    });
  }
}
