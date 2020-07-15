import * as os from 'os';
import { MetricObservableSet } from '../MetricObservableSet';

type CpuInfo = os.CpuInfo['times'];
export class CpuGaugeSet extends MetricObservableSet {
  accumulatedCpuUsage: CpuInfo;
  cpuUsage: CpuInfo;

  onSubscribe() {
    this.getValue();
    // TODO: Labels
    this.createObservable('system_cpu_idle', () => this.cpuUsage.idle, {});
    this.createObservable('system_cpu_system', () => this.cpuUsage.sys, {});
    this.createObservable('system_cpu_user', () => this.cpuUsage.user, {});
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
      cpuUsage[key] =
        accumulatedCpuUsage[key] -
        (this.accumulatedCpuUsage?.[key] ?? accumulatedCpuUsage[key]);
    }

    this.accumulatedCpuUsage = accumulatedCpuUsage;
    this.cpuUsage = cpuUsage;
  }
}
