import { IIndicator, IndicatorResultObject } from './types';
import { IndicatorUtil } from './IndicatorUtil';
import { IndicatorManagerProxy } from './IndicatorManagerProxy';
import { HubFacade } from 'pandora-hub';
const PID = process.pid.toString();

export class IndicatorManager {
  store: Map<string, IIndicator[]> = new Map();
  ctx: any;
  proxy: IndicatorManagerProxy;
  constructor(ctx) {
    this.ctx = ctx;
    this.proxy = new IndicatorManagerProxy(this);
  }
  register(indicator: IIndicator) {
    const { group } = indicator;
    if (!this.store.has(group)) {
      this.store.set(group, []);
    }
    const list = this.store.get(group);
    list.push(indicator);
  }
  get(group: string): IIndicator[] {
    return this.store.get(group);
  }
  async invokeRaw(
    group: string,
    query: any = {}
  ): Promise<IndicatorResultObject[]> {
    const indicators = this.store.get(group);
    if (!indicators) {
      throw new Error('No such indicators with group: ' + group);
    }
    const ret: IndicatorResultObject[] = [];
    for (const indicator of indicators) {
      const { scope, key } = indicator;
      if (
        (query.key && key !== query.key) ||
        (query.scope && scope !== query.scope)
      ) {
        continue;
      }
      const data = await indicator.invoke(query);
      ret.push({
        group,
        key,
        data,
        scope,
        pid: PID,
        appName: this.ctx.appName,
      });
    }
    return ret;
  }

  async invoke(group: string, query: any = {}) {
    const rawRows = await this.invokeRaw(group, query);
    return IndicatorUtil.mergeRawIndicatorResultRows(rawRows);
  }
  async invokeAllProcessesRaw(
    group: string,
    query: any = {}
  ): Promise<IndicatorResultObject[]> {
    const selectors = {
      appName: query.appName,
      pid: query.pid,
    };
    const hubFacade: HubFacade = this.ctx.hubFacade;
    const consumer = hubFacade.getConsumer({
      name: IndicatorManagerProxy.SERVICE_NAME_AT_IPC_HUB,
    });
    const batchRows = await consumer.multipleInvoke(
      'overProcessCallHandle',
      [group, query],
      selectors
    );
    let ret = [];
    for (const row of batchRows) {
      ret = ret.concat(row.data);
    }
    return ret;
  }

  async invokeAllProcesses(group: string, query: any = {}) {
    const rawRows = await this.invokeAllProcessesRaw(group, query);
    return IndicatorUtil.mergeRawIndicatorResultRows(rawRows);
  }

  async publish() {
    const hubFacade: HubFacade = this.ctx.hubFacade;
    await hubFacade.publish(this.proxy, {
      name: IndicatorManagerProxy.SERVICE_NAME_AT_IPC_HUB,
    });
  }
}
