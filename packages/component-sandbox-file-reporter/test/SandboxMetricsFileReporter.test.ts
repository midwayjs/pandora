import {expect} from 'chai';
import {SandboxMetricsFileReporter} from '../src/SandboxMetricsFileReporter';
import {tmpdir} from 'os';
import {join} from 'path';
import {FileLoggerManager} from 'pandora-component-file-logger-service';
import {readFileSync} from 'fs';
import {FileReporterUtil} from '../src/FileReporterUtil';

describe('SandboxMetricsFileReporter', () => {

  const tmpLogsDir = join(tmpdir(), 'pandora-test', Date.now().toString());
  const appName = 'fakeApp';

  it('should write log be ok be ok', async () => {

    const ctx: any = {
      appName,
      fileLoggerManager: new FileLoggerManager({stopWriteWhenNoSupervisor: false}),
      config: {
        sandboxFileReporter: {
          logsDir: tmpLogsDir,
          globalTags: {
            testGlobalTag: 1
          },
          metrics: {
            type: 'size',
            maxFileSize: 100 * 1024 * 1024,
            stdoutLevel: 'NONE',
            level: 'ALL'
          },
        }
      }
    };

    const obj = {
      metric: 'metricsName',
      timestamp: Date.now(),
      value: 1235,
      type: 'counter',
      level: 'Normal',
      tags: {},
      interval: -1
    };

    const sandboxMetricsFileReporter = new SandboxMetricsFileReporter(ctx);
    await sandboxMetricsFileReporter.report([obj]);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const targetPath = join(tmpLogsDir, appName, 'sandbox-metrics.log');
    const contentRaw = readFileSync(targetPath).toString();
    const json = JSON.parse(contentRaw);

    expect(json).to.deep.include({
      ...obj,
      unix_timestamp: FileReporterUtil.unix(obj.timestamp),
      ...ctx.config.sandboxFileReporter.globalTags,
      tags: {
        ...obj.tags,
        ...ctx.config.sandboxFileReporter.globalTags,
      }
    });

  });


});