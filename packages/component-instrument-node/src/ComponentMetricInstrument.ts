import { componentName, dependencies } from '@pandorajs/component-decorator';
import { V8HeapGaugeSet } from './node/V8HeapGaugeSet';
import { V8HeapSpaceGaugeSet } from './node/V8HeapSpaceGaugeSet';
import { DiskStatGaugeSet } from './system/DiskStatGaugeSet';
import { NetGaugeSet } from './system/NetGaugeSet';
import { LoadGaugeSet } from './system/LoadGaugeSet';
import { MemGaugeSet } from './system/MemGaugeSet';
import { CpuGaugeSet } from './system/CpuGaugeSet';

const supervisorSets = [
  CpuGaugeSet,
  DiskStatGaugeSet,
  NetGaugeSet,
  LoadGaugeSet,
  MemGaugeSet,
];
const processSets = [V8HeapGaugeSet, V8HeapSpaceGaugeSet];

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
