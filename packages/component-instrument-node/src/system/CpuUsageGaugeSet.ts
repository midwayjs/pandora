import { startsWith, extractInt } from '@pandorajs/dollar';
import * as fs from 'fs';
import { MetricObservableSet } from '../MetricObservableSet';
import { Meter } from '@opentelemetry/metrics';

const debug = require('debug')('metrics:cpu');

const CpuInfo = {
  /**
   * user: normal processes executing in user mode
   */
  userTime: 0,
  /**
   * nice: niced processes executing in user mode
   */
  niceTime: 0,
  /**
   * system: processes executing in kernel mode
   */
  systemTime: 0,
  /**
   * idle: twiddling thumbs
   */
  idleTime: 0,
  /**
   *
   * iowait: In a word, iowait stands for waiting for I/O to complete. But there
   * are several problems:
   * 1. Cpu will not wait for I/O to complete, iowait is the time that a task is
   * waiting for I/O to complete. When cpu goes into idle state for
   * outstanding task io, another task will be scheduled on this CPU.
   * 2. In a multi-core CPU, the task waiting for I/O to complete is not running
   * on any CPU, so the iowait of each CPU is difficult to calculate.
   * 3. The value of iowait field in /proc/stat will decrease in certain
   * conditions.
   * So, the iowait is not reliable by reading from /proc/stat.
   */
  iowaitTime: 0,
  /**
   * irq: servicing interrupts
   */
  irqTime: 0,
  /**
   * softirq: servicing softirqs
   */
  softirqTime: 0,
  /**
   * steal: involuntary wait, since 2.6.11
   */
  stealTime: 0,
  /**
   * guest: running a normal guest, since 2.6.24
   */
  guestTIme: 0,
  /**
   * Total time
   */
  totalTime: 0,
};

const getUsage = (current: number, last: number, currentInfo, lastInfo) => {
  return (
    (100 * (current - last)) / (currentInfo.totalTime - lastInfo.totalTime)
  );
};

const parseCpuInfo = line => {
  const stats = line.match(/\d+/g).map(num => parseInt(num, 10));
  const cpuInfo = { ...CpuInfo };
  let totalTime = 0;
  let i = 0;
  for (const k in cpuInfo) {
    if (i === stats.length) {
      break; // avoid iterating on totalTime
    }

    const stat = stats[i++];
    cpuInfo[k] = stat;
    totalTime += stat;
  }
  cpuInfo.totalTime = totalTime;
  return cpuInfo;
};

export class CpuUsageGaugeSet extends MetricObservableSet {
  static DEFAULT_FILE_PATH = '/proc/stat';

  cpuUsage = [];

  filePath: string;

  cpuUsageRate = 0; // 总使用率
  totalInterrupts = 0;
  interruptsRate = 0;
  totalContextSwitches = 0;
  contextSwitchesRate = 0;
  processRunning = 0;
  processBlocked = 0;

  names = [
    'cpu_user',
    'cpu_nice',
    'cpu_system',
    'cpu_idle',
    'cpu_iowait',
    'cpu_irq',
    'cpu_softirq',
    'cpu_steal',
    'cpu_guest',
  ];

  nameIdx = {};

  constructor(meter: Meter, filePath = CpuUsageGaugeSet.DEFAULT_FILE_PATH) {
    super(meter);
    this.filePath = filePath;
    for (const idx in this.names) {
      this.nameIdx[idx] = this.names[idx];
    }
  }

  onSubscribe() {
    for (const name of this.names) {
      this.createObservable(
        name,
        () => {
          return this.cpuUsage[name];
        },
        {}
      );
    }

    this.createObservable('cpu_usage', () => this.cpuUsageRate, {});
    this.createObservable('interrupts', () => this.totalInterrupts, {});
    this.createObservable(
      'context_switches',
      () => this.totalContextSwitches,
      {}
    );
    this.createObservable('process_running', () => this.processRunning, {});
    this.createObservable('process_blocked', () => this.processBlocked, {});
  }

  getValue() {
    let stat;
    try {
      stat = fs.readFileSync(this.filePath).toString().split('\n');
    } catch (e) {
      debug(e);
      return;
    }

    let lastCollectedCpuInfo = { ...CpuInfo };

    for (const line of stat) {
      if (startsWith(line, 'cpu ')) {
        const cpuInfo = parseCpuInfo(line);
        let index = 0;

        for (const key in cpuInfo) {
          if (key === 'totalTime') continue;
          this.cpuUsage[this.nameIdx[index++]] = getUsage(
            cpuInfo[key],
            lastCollectedCpuInfo[key],
            cpuInfo,
            lastCollectedCpuInfo
          );
        }

        /**
         * CPU在t1和t2时间内总的使用时间:( user2+ nice2+ system2+ idle2+ iowait2+ irq2+ softirq2 + steal2 + guest2 + guest_nice2 ) - ( user1+ nice1+ system1+ idle1+ iowait1+ irq1+ softirq1 + steal1 + guest1 + guest_nice1)
         * CPU的空闲时间：(idle2 -idle1)
         * CPU在t1和t2时间内的使用率=CPU非空闲时间/CPU总时间*100%=（1-CPU的空闲时间/CPU总时间）*100%
         * 则：
         * CPU(t1,t2)使用率：1-(idle2-idle1)/(( user2+ nice2+ system2+ idle2+ iowait2+ irq2+ softirq2 + steal2 + guest2 + guest_nice2 ) - ( user1+ nice1+ system1+ idle1+ iowait1+ irq1+ softirq1 + steal1 + guest1 + guest_nice1))
         */

        /**
         * guest 没有暂时不算
         */

        const cpuTotalTime = cpuInfo.totalTime - lastCollectedCpuInfo.totalTime;
        const cpuIdleTime = cpuInfo.idleTime - lastCollectedCpuInfo.idleTime;
        this.cpuUsageRate = 1 - cpuIdleTime / cpuTotalTime;

        lastCollectedCpuInfo = cpuInfo;
        continue;
      }

      if (startsWith(line, 'intr')) {
        const latestIntr = extractInt(line);
        if (this.totalInterrupts === 0) {
          // first time
          this.interruptsRate = 0;
        } else {
          this.interruptsRate =
            (1000.0 * (latestIntr - this.totalInterrupts)) / this.interval;
        }
        this.totalInterrupts = latestIntr;
        continue;
      }

      if (startsWith(line, 'ctxt')) {
        const latestCtxt = extractInt(line);
        if (this.totalContextSwitches === 0) {
          this.contextSwitchesRate = 0.0;
        } else {
          this.contextSwitchesRate =
            (1000.0 * (latestCtxt - this.totalContextSwitches)) / this.interval;
        }
        this.totalContextSwitches = latestCtxt;
        continue;
      }
      if (startsWith(line, 'procs_running')) {
        this.processRunning = extractInt(line);
        continue;
      }
      if (startsWith(line, 'procs_blocked')) {
        this.processBlocked = extractInt(line);
      }
    }
  }
}
