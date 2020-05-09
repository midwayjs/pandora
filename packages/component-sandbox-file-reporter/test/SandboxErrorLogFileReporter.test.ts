import {expect} from 'chai';
import {SandboxErrorLogFileReporter} from '../src/SandboxErrorLogFileReporter';
import {tmpdir} from 'os';
import {join} from 'path';
import {FileLoggerManager} from '@pandorajs/component-file-logger-service';
import {readFileSync, writeFileSync} from 'fs';
import {FileReporterUtil} from '../src/FileReporterUtil';

describe('SandboxErrorLogFileReporter', () => {

  const tmpLogsDir = join(tmpdir(), '@pandorajs/test', Date.now().toString());
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
          error: {
            type: 'size',
            maxFileSize: 100 * 1024 * 1024,
            stdoutLevel: 'NONE',
            level: 'ALL'
          },
        }
      }
    };

    const obj = {
      timestamp: Date.now(),
      method: 'error',
      errType: 'errType',
      message: 'testMsg',
      stack: 'testStack',
      traceId: 'testTraceId',
      path: 'testPAth'
    };

    const sandboxErrorLogFileReporter = new SandboxErrorLogFileReporter(ctx);
    await sandboxErrorLogFileReporter.report([obj]);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const targetPath = join(tmpLogsDir, appName, 'sandbox-errors.log');
    const contentRaw = readFileSync(targetPath).toString();
    writeFileSync(targetPath, '');
    const json = JSON.parse(contentRaw);

    expect(json).to.be.include({
      ...obj,
      unix_timestamp: FileReporterUtil.unix(obj.timestamp),
      ...ctx.config.sandboxFileReporter.globalTags
    });

  });


  it('should skip log when use lower level method', async () => {

    const ctx: any = {
      appName,
      fileLoggerManager: new FileLoggerManager({stopWriteWhenNoSupervisor: false}),
      config: {
        sandboxFileReporter: {
          logsDir: tmpLogsDir,
          globalTags: {
            testGlobalTag: 1
          },
          error: {
            type: 'size',
            maxFileSize: 100 * 1024 * 1024,
            stdoutLevel: 'NONE',
            level: 'ERROR'
          },
        }
      }
    };

    const obj = {
      timestamp: Date.now(),
      method: 'warn',
      errType: 'errType',
      message: 'testMsg',
      stack: 'testStack',
      traceId: 'testTraceId',
      path: 'testPAth'
    };

    const sandboxErrorLogFileReporter = new SandboxErrorLogFileReporter(ctx);
    await sandboxErrorLogFileReporter.report([obj]);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const targetPath = join(tmpLogsDir, appName, 'sandbox-errors.log');
    const contentRaw = readFileSync(targetPath).toString();
    expect(contentRaw).to.equal('');

  });


});
