import {CoreSDK} from '../../src/CoreSDK';
import {Indicator, IndicatorScope} from '../../src/built-in-component/indicator/domain';


class TestIndicator implements Indicator {
  group: string = 'process';
  scope: IndicatorScope.PROCESS;
  async invoke(query: any) {
    return {
      query: query,
      processName: 'mock',
      ppid: (<any> process).ppid,
      pid: process.pid,
      title: process.title,
      argv: (<any> process).__pandoraOriginArgv || process.argv,
      execArgv: process.execArgv,
      debugPort: (<any> process).debugPort,
      execPath: process.execPath,
      uptime: process.uptime(),
    };
  }
}


describe('function/indicator', function () {
  it('should invoke indicator over all processes be ok', async () => {
    const supervisor = new CoreSDK({
      mode: 'supervisor',
      appName: 'test',
      appDir: process.cwd()
    });
    await supervisor.start();
    const worker = new CoreSDK({
      mode: 'worker',
      appName: 'test',
      appDir: process.cwd()
    });
    await worker.start();
    supervisor.coreContext.indicatorManager.register(new TestIndicator());
    worker.coreContext.indicatorManager.register(new TestIndicator());
    const res = await worker.coreContext.indicatorManager.invokeAllProcessesRaw('process');
    console.log(res);
  });
});


