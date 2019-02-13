import { fork } from './TestUtil';
import { FakeMySQLServer } from './helpers/fake-mysql-server/FakeMySQLServer';

describe('ComponentAutoPatching -> integration', function () {
  const fakeServerPort = 32893;
  let fakeServer;

  before(async () => {
    fakeServer = new FakeMySQLServer();

    await new Promise((resolve) => {
      fakeServer.listen(fakeServerPort, resolve);
    });
  });

  after(async () => {
    await fakeServer.destroy();
  });

  it('should work well', (done) => {
    fork('integration', done);
  });
});