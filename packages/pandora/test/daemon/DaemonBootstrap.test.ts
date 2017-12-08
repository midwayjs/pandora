import {DaemonBootstrap} from '../../src/daemon/DaemonBootstrap';

declare const global: {
  shimIpc: any;
} & NodeJS.Global;

describe('DaemonBootstrap', function () {

  before(async () => {
    if(global.shimIpc) {
      await global.shimIpc.stop();
    }
  });

  after(async () => {
    if(global.shimIpc) {
      await global.shimIpc.start();
    }
  });

  let daemonBootstrap: DaemonBootstrap;

  before(async () => {
    daemonBootstrap = new DaemonBootstrap;
  });

  it('should start be ok', async () => {
    await daemonBootstrap.start();
  });

  it('should stop be ok', async () => {
    await daemonBootstrap.stop();
  });

});

