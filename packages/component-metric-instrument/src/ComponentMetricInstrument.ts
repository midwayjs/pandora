import { componentName, dependencies } from '@pandorajs/component-decorator';
import { V8GaugeSet } from './node/V8GaugeSet';
import { CpuUsageGaugeSet } from './os/CpuUsageGaugeSet';
import { DiskStatGaugeSet } from './os/DiskStatGaugeSet';
import { NetTrafficGaugeSet } from './os/NetTrafficGaugeSet';
import { SystemLoadGaugeSet } from './os/SystemLoadGaugeSet';
import { SystemMemoryGaugeSet } from './os/SystemMemoryGaugeSet';
import { TcpGaugeSet } from './os/TcpGaugeSet';
import os = require('os');

const linuxSets = [
  CpuUsageGaugeSet,
  DiskStatGaugeSet,
  NetTrafficGaugeSet,
  SystemMemoryGaugeSet,
  TcpGaugeSet,
];
const supervisorSets = [
  ...(os.platform() === 'linux' ? linuxSets : []),
  SystemLoadGaugeSet,
];
const processSets = [V8GaugeSet];

@componentName('metricInstrument')
@dependencies(['metric'])
export default class ComponentMetricInstrument {
  ctx: any;
  constructor(ctx: any) {
    this.ctx = ctx;
  }

  async startAtSupervisor() {
    const meter = this.ctx.meterProvider.getMeter('pandora');
    [...supervisorSets, ...processSets].forEach(Klass => {
      const set = new Klass(meter);
      set.subscribe();
    });
  }

  async start() {
    const meter = this.ctx.meterProvider.getMeter('pandora');
    [...processSets].forEach(Klass => {
      const set = new Klass(meter);
      set.subscribe();
    });
  }
}
