import {expect} from 'chai';
import {SandboxTraceFileReporter} from '../src/SandboxTraceFileReporter';
import {tmpdir} from 'os';
import {join} from 'path';
import {FileLoggerManager} from 'pandora-component-file-logger-service';
import {readFileSync} from 'fs';
import {FileReporterUtil} from '../src/FileReporterUtil';

describe('SandboxTraceFileReporter', () => {

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
          trace: {
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
      traceName: 'traceName',
      spans: [
        {
          toJSON() {
            return {
              testSpan: 1
            };
          }
        },
        {
          testSpan: 2
        }
      ]
    };

    const sandboxTraceFileReporter = new SandboxTraceFileReporter(ctx);
    await sandboxTraceFileReporter.report([obj]);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const targetPath = join(tmpLogsDir, appName, 'sandbox-traces.log');
    const contentRaw = readFileSync(targetPath).toString();
    const json = JSON.parse(contentRaw);

    const expected = {
      ...obj,
      name: obj.traceName,
      unix_timestamp: FileReporterUtil.unix(obj.timestamp),
      spans: [
        obj.spans[0].toJSON(),
        obj.spans[1]
      ],
      ...ctx.config.sandboxFileReporter.globalTags
    };
    delete expected.traceName;
    expect(json).to.deep.include(expected);

  });


});