import {DaemonBootstrap} from '../../src/daemon/DaemonBootstrap';

describe('DaemonBootstrap', function () {

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

