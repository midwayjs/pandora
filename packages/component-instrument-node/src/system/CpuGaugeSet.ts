import * as os from 'os';
import { SystemMetric } from '@pandorajs/semantic-conventions';
import { MetricObservableSet } from '../MetricObservableSet';

type CpuInfo = os.CpuInfo['times'];
export class CpuGaugeSet extends MetricObservableSet {
  private accumulatedCpuUsage: CpuInfo;
  private cpuUsage: CpuInfo;

  onSubscribe() {
    this.createValueObserver(SystemMetric.CPU_IDLE, () => [
      [this.cpuUsage.idle, {}],
    ]);
    this.createValueObserver(SystemMetric.CPU_SYSTEM, () => [
      [this.cpuUsage.sys, {}],
    ]);
    this.createValueObserver(SystemMetric.CPU_USER, () => [
      [this.cpuUsage.user, {}],
    ]);
  }

  async getValue() {
    const cpus = os.cpus();
    const accumulatedCpuUsage = cpus.reduce((prev, curr) => {
      for (const [key, val] of Object.entries(curr.times)) {
        prev[key] = (prev[key] ?? 0) + val;
      }
      return prev;
    }, {}) as CpuInfo;

    const cpuUsage = {} as CpuInfo;
    for (const [key, val] of Object.entries(accumulatedCpuUsage)) {
      cpuUsage[key] = val - (this.accumulatedCpuUsage?.[key] ?? val);
    }

    this.accumulatedCpuUsage = accumulatedCpuUsage;
    this.cpuUsage = cpuUsage;
  }
}
