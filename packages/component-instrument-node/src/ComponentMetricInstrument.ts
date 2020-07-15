import { componentName, dependencies } from '@pandorajs/component-decorator';
import { V8GaugeSet } from './node/V8GaugeSet';
import { CpuUsageGaugeSet } from './system/CpuUsageGaugeSet';
import { DiskStatGaugeSet } from './system/DiskStatGaugeSet';
import { NetTrafficGaugeSet } from './system/NetTrafficGaugeSet';
import { SystemLoadGaugeSet } from './system/SystemLoadGaugeSet';
import { SystemMemoryGaugeSet } from './system/SystemMemoryGaugeSet';
import { TcpGaugeSet } from './system/TcpGaugeSet';
import os = require('os');
import { CpuGaugeSet } from './system/CpuGaugeSet';

// TODO: prefixes
const linuxSets = [
  CpuUsageGaugeSet,
  DiskStatGaugeSet,
  NetTrafficGaugeSet,
  SystemMemoryGaugeSet,
  TcpGaugeSet,
];
const supervisorSets = [
  ...(os.platform() === 'linux' ? linuxSets : []),
  CpuGaugeSet,
  SystemLoadGaugeSet,
];
const processSets = [V8GaugeSet];

@componentName('instrumentNode')
@dependencies(['metric'])
export default class ComponentInstrumentNode {
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
