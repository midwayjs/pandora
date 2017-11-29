/**
 * 系统指标
 */

import {Indicator} from '../Indicator';
import {IBuilder, IndicatorScope, IndicatorType} from '../../domain';
import * as pusage from 'pidusage';

export class ProcessIndicator extends Indicator {

  group: string = 'process';

  type: IndicatorType = 'multiton';

  async invoke(data: any, builder: IBuilder) {

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
      pid: process.pid,
      title: process.title,
      argv: process.argv,
      execArgv: process.execArgv,
      execPath: process.execPath,
      cpu: stat.cpu,
      memory: stat.memory,
      versions: process.versions,
      features:(<any> process).features,
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
