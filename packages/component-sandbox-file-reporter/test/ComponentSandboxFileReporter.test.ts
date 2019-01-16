import {join} from 'path';
import {homedir} from 'os';
import {expect} from 'chai';
import {ComponentReflector, IComponentConstructor} from 'pandora-component-decorator';
import ComponentSandboxFileReporter from '../src/ComponentSandboxFileReporter';
import {FileLoggerManager} from 'pandora-component-file-logger-service';
import {SandboxMetricsFileReporter} from '../src/SandboxMetricsFileReporter';
import {SandboxTraceFileReporter} from '../src/SandboxTraceFileReporter';
import {SandboxErrorLogFileReporter} from '../src/SandboxErrorLogFileReporter';

describe('ComponentSandboxFileReporter', () => {

  it('should have correct meta info', () => {
    expect(ComponentReflector.getComponentName(<IComponentConstructor> ComponentSandboxFileReporter)).to.be.equal('sandboxFileReporter');
    expect(ComponentReflector.getDependencies(<IComponentConstructor> ComponentSandboxFileReporter)).to.deep.equal(['reporterManager', 'fileLoggerService']);
    expect(ComponentReflector.getComponentConfig(<IComponentConstructor> ComponentSandboxFileReporter)).to.deep.equal({
      sandboxFileReporter: {
        logsDir: join(homedir(), 'logs'),
        globalTags: {},
        metrics: {
          type: 'size',
          maxFileSize: 100 * 1024 * 1024,
          stdoutLevel: 'NONE',
          level: 'ALL'
        },
        trace: {
          type: 'size',
          maxFileSize: 100 * 1024 * 1024,
          stdoutLevel: 'NONE',
          level: 'ALL'
        },
        error: {
          type: 'size',
          maxFileSize: 100 * 1024 * 1024,
          stdoutLevel: 'NONE',
          level: 'ALL'
        },
      }
    });
  });

  it('should startAtAllProcesses() be ok', () => {

    const gotReporters = [];

    const ctx: any = {
      appName: 'testAppName',
      config: {
        ...ComponentReflector.getComponentConfig(<IComponentConstructor> ComponentSandboxFileReporter),
      },
      fileLoggerManager: new FileLoggerManager({stopWriteWhenNoSupervisor: false}),
      reporterManager: {
        register(name, reporter) {
          gotReporters.push([name, reporter]);
        }
      }
    };

    const componentSandboxFileReporter = new ComponentSandboxFileReporter(ctx);
    componentSandboxFileReporter.startAtAllProcesses();
    expect(gotReporters.length).to.be.equal(3);
    expect(gotReporters[0][0]).to.be.equal('sandboxMetricsFileReporter');
    expect(gotReporters[1][0]).to.be.equal('sandboxTraceFileReporter');
    expect(gotReporters[2][0]).to.be.equal('sandboxErrorLogFileReporter');
    expect(gotReporters[0][1]).to.be.an.instanceof(SandboxMetricsFileReporter);
    expect(gotReporters[1][1]).to.be.an.instanceof(SandboxTraceFileReporter);
    expect(gotReporters[2][1]).to.be.an.instanceof(SandboxErrorLogFileReporter);

  });

  it('should start() / startAtSupervisor() as alias of startAtAllProcesses', async () => {

    let calledTimes = 0;
    const fakeComponentSandboxFileReporter: ComponentSandboxFileReporter = <any> {
      start: ComponentSandboxFileReporter.prototype.start,
      startAtSupervisor: ComponentSandboxFileReporter.prototype.startAtSupervisor,
      startAtAllProcesses() {
        calledTimes++;
      }
    };

    await fakeComponentSandboxFileReporter.startAtSupervisor();
    expect(calledTimes).to.be.equal(1);

    await fakeComponentSandboxFileReporter.start();
    expect(calledTimes).to.be.equal(2);

  });

});
