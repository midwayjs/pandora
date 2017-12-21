/**
 * 系统指标
 */

import {Indicator} from '../Indicator';
import {IBuilder, IndicatorScope, IndicatorType} from '../../domain';
import * as pusage from 'pidusage';

export class ProcessIndicator extends Indicator {

  group: string = 'process';

  type: IndicatorType = 'multiton';

  async invoke(args: any, builder: IBuilder) {

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
      stat = this.tryGetCpuAndMem();
    }

    builder.withDetail(String(process.pid), {
      processName: this.environment.get('processName'),
      ppid: (<any> process).ppid,
      pid: process.pid,
      title: process.title,
      argv: process.argv,
      execArgv: process.execArgv,
      execPath: process.execPath,
      cpu: builder.pretty('%s%', stat.cpu),
      memory: stat.memory,
      uptime: process.uptime(),
    }, IndicatorScope.PROCESS);

  }

  private tryGetCpuAndMem() {
    if((<any> process).cpuUsage) {
      return {
        cpu: (<any> process).cpuUsage(),
        memory: process.memoryUsage()
      };
    }
  }
}
