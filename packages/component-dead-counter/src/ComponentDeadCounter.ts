import {componentName, dependencies} from 'pandora-component-decorator';
import {HubServer, Selector} from 'pandora-hub';
import {MetricsManager, MetricName} from 'metrics-common';

@componentName('deadCounter')
@dependencies(['ipcHub', 'metrics', 'errorLog'])
export default class ComponentDeadCounter {

  ctx: any;
  constructor(ctx) {
    if(ctx.mode === 'supervisor') {
      const hubServer: HubServer = ctx.hubServer;
      const metricsManager: MetricsManager = ctx.metricsManager;
      const errorLogManager = ctx.errorLogManager;
      const counter = metricsManager.getCounter('supervisor', MetricName.build('process_disconnected'));
      hubServer.on('client_disconnected', (selectors: Selector[]) => {
        try {
          const processSelector: Selector = selectors[1];
          counter.inc();
          errorLogManager.record({
            timestamp: Date.now(),
            errType: 'processDisconnected',
            message: 'process disconnected PID: ' + processSelector.pid,
            stack: '',
            traceId: '',
            path: 'component-dead-counter'
          });
        } catch(err) {
          // TODO: add a debug info here
        }
      });
    }
  }

}