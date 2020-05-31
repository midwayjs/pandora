import { componentName, dependencies } from '@pandorajs/component-decorator';
import { HubServer, Selector } from '@pandorajs/hub';
const debug = require('debug')('pandora:ComponentDeadCounter');

@componentName('deadCounter')
@dependencies(['ipcHub', 'metric', 'errorLog'])
export default class ComponentDeadCounter {
  constructor(private ctx) {}

  async startAtSupervisor() {
    const counter = this.ctx.meterProvider
      .getMeter('supervisor')
      .createCounter('process_disconnected')
      .bind({});
    const hubServer: HubServer = this.ctx.hubServer;
    const errorLogManager = this.ctx.errorLogManager;
    hubServer.on('client_disconnected', (selectors: Selector[]) => {
      counter.add(1);
      try {
        const processSelector: Selector = selectors[1];
        errorLogManager.record({
          timestamp: Date.now(),
          errType: 'processDisconnected',
          message: 'process disconnected PID: ' + processSelector.pid,
          stack: '',
          traceId: '',
          path: 'component-dead-counter',
        });
      } catch (err) {
        debug(err);
      }
    });
  }
}
