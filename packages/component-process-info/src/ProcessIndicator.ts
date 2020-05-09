import * as pusage from 'pidusage';
import {IIndicator, IndicatorScope} from '@pandorajs/component-indicator';

export class ProcessInfoIndicator implements IIndicator {

  group: string = 'process';
  scope = IndicatorScope.PROCESS;
  ctx: any;

  constructor(ctx) {
    this.ctx = ctx;
  }

  async invoke(query?) {
    let stat;
    try {
      stat = await new Promise((resolve, reject) => {
        pusage.stat(process.pid, function(err, stat) {
          if(err) {
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
      ppid: (<any> process).ppid,
      pid: process.pid,
      title: process.title,
      argv: (<any> process).__pandoraOriginArgv || process.argv,
      execArgv: process.execArgv,
      debugPort: (<any> process).debugPort,
      inspectorUrl: ProcessInfoIndicator.getInspectorUrl(),
      execPath: process.execPath,
      cpu: stat.cpu,
      memory: stat.memory,
      uptime: process.uptime(),
    };
  }

  private tryGetCpuAndMem() {
    if((<any> process).cpuUsage) {
      return {
        cpu: (<any> process).cpuUsage(),
        memory: process.memoryUsage()
      };
    }
  }

  static getInspectorUrl() {
    try {
      return require('inspector').url();
    } catch(err) {
      return null;
    }
  }

}
