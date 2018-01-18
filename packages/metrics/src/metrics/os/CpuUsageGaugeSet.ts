import {CachedMetricSet} from '../../client/CachedMetricSet';
import {MetricName} from '../../common/MetricName';
import {Gauge} from '../../client/MetricsProxy';
import {startsWith, extractInt} from '../../util/IndicatorHelper';
import * as fs from 'fs';


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
  totalTime: 0
};


const getUsage = (current: number, last: number, currentInfo, lastInfo) => {
  return 100 * (current - last) / (currentInfo.totalTime - lastInfo.totalTime);
};

const parseCpuInfo = line => {
  const stats = line.match(/\d+/g).map(num => parseInt(num, 10));
  const cpuInfo = (<any>Object).assign({}, CpuInfo);
  let totalTime = 0;
  let i = 0;
  for (let k in cpuInfo) {

    if (i === stats.length) {
      break; // avoid iterating on totalTime
    }

    let stat = stats[i++];
    cpuInfo[k] = stat;
    totalTime += stat;
  }
  cpuInfo.totalTime = totalTime;
  return cpuInfo;
};

export class CpuUsageGaugeSet extends CachedMetricSet {


  static DEFAULT_FILE_PATH = '/proc/stat';

  cpuUsage = [];

  filePath: string;

  totalInterrupts: number = 0;

  interruptsRate: number = 0;

  totalContextSwitches: number = 0;

  contextSwitchesRate: number = 0;

  processRunning: number = 0;

  processBlocked: number = 0;

  names = [
    'cpu.user',
    'cpu.nice',
    'cpu.system',
    'cpu.idle',
    'cpu.iowait',
    'cpu.irq',
    'cpu.softirq',
    'cpu.steal',
    'cpu.guest'
  ];

  nameIdx = {};

  cpuUsageRate = 0; // 总使用率

  constructor(dataTTL = 5, filePath = CpuUsageGaugeSet.DEFAULT_FILE_PATH) {
    super(dataTTL);
    this.filePath = filePath;
    for(let idx in this.names) {
      this.nameIdx[idx] = this.names[idx];
    }
  }

  getMetrics() {
    let self = this;
    let gauges = [];

    for (let name of this.names) {
      gauges.push({
        name: MetricName.build(name),
        metric: <Gauge<number>> {
          getValue() {
            self.refreshIfNecessary();
            return self.cpuUsage[name];
          }
        }
      });
    }

    gauges.push({
      name: MetricName.build('cpu.usage'),
      metric: <Gauge<number>> {
        getValue() {
          self.refreshIfNecessary();
          return self.cpuUsageRate;
        }
      }
    });

    gauges.push({
      name: MetricName.build('interrupts'),
      metric: <Gauge<number>> {
        getValue() {
          self.refreshIfNecessary();
          return self.totalInterrupts;
        }
      }
    });

    gauges.push({
      name: MetricName.build('context.switches'),
      metric: <Gauge<number>> {
        getValue() {
          self.refreshIfNecessary();
          return self.totalContextSwitches;
        }
      }
    });

    gauges.push({
      name: MetricName.build('process.running'),
      metric: <Gauge<number>> {
        getValue() {
          self.refreshIfNecessary();
          return self.processRunning;
        }
      }
    });

    gauges.push({
      name: MetricName.build('process.blocked'),
      metric: <Gauge<number>> {
        getValue() {
          self.refreshIfNecessary();
          return self.processBlocked;
        }
      }
    });

    return gauges;
  }

  getValueInternal() {

    const self = this;
    let stat;
    try {
      stat = fs.readFileSync(self.filePath).toString().split('\n');
    } catch (e) {
      debug(e);
      return;
    }

    let lastCollectedCpuInfo = (<any>Object).assign({}, CpuInfo);

    for (let line of stat) {
      if (startsWith(line, 'cpu ')) {

        let cpuInfo = parseCpuInfo(line);
        let index = 0;

        for (const key in cpuInfo) {
          if (key === 'totalTime') continue;
          this.cpuUsage[this.nameIdx[index++]] = getUsage(cpuInfo[key], lastCollectedCpuInfo[key], cpuInfo, lastCollectedCpuInfo);
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

        let cpuTotalTime = cpuInfo.totalTime - lastCollectedCpuInfo.totalTime;
        let cpuIdleTime = cpuInfo.idleTime - lastCollectedCpuInfo.idleTime;
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
          let duration = Date.now() - this.lastCollectTime;
          this.interruptsRate = 1000.0 * (latestIntr - this.totalInterrupts) / duration;
        }
        this.totalInterrupts = latestIntr;
        continue;
      }

      if (startsWith(line, 'ctxt')) {
        const latestCtxt = extractInt(line);
        if (this.totalContextSwitches === 0) {
          this.contextSwitchesRate = 0.0;
        } else {
          const duration = +(new Date()) - this.lastCollectTime;
          this.contextSwitchesRate = 1000.0 * (latestCtxt - this.totalContextSwitches) / duration;
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
