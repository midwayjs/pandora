import * as pusage from 'pidusage';
import { IIndicator, IndicatorScope } from '@pandorajs/component-indicator';

export class ProcessInfoIndicator implements IIndicator {
  group = 'process';
  scope = IndicatorScope.PROCESS;
  ctx: any;

  constructor(ctx) {
    this.ctx = ctx;
  }

  async invoke(query?) {
    let stat;
    try {
      stat = await new Promise((resolve, reject) => {
        pusage.stat(process.pid, (err, stat) => {
          if (err) {
            reject(err);
          } else {
            resolve(stat);
          }
        });
      });
    } catch (err) {
      stat = this.tryGetCpuAndMem() || {};
    }
    return {
      v: 2, // mark it as Pandora.js 2
      processName: this.ctx.processName,
      // eslint-disable-next-line node/no-unsupported-features/node-builtins
      ppid: process.ppid,
      pid: process.pid,
      title: process.title,
      argv: (process as any).__pandoraOriginArgv || process.argv,
      execArgv: process.execArgv,
      debugPort: process.debugPort,
      inspectorUrl: ProcessInfoIndicator.getInspectorUrl(),
      execPath: process.execPath,
      cpu: stat.cpu,
      memory: stat.memory,
      uptime: process.uptime(),
    };
  }

  private tryGetCpuAndMem() {
    if (process.cpuUsage) {
      return {
        cpu: process.cpuUsage(),
        memory: process.memoryUsage(),
      };
    }
  }

  static getInspectorUrl() {
    try {
      // eslint-disable-next-line node/no-unsupported-features/node-builtins
      return require('inspector').url();
    } catch (err) {
      return null;
    }
  }
}
