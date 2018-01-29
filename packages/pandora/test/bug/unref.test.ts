import {ApplicationHandler} from '../../dist/application/ApplicationHandler';
import {join} from 'path';
const pathProjectShortExec = join(__dirname, '../fixtures/project/short_exec');

describe('bug/unref', function () {
  it('should start ShortExec be ok', async function () {
    const ah = new ApplicationHandler({
      appName: 'shortExec',
      appDir: pathProjectShortExec
    });
    await ah.start();
    await ah.stop();
  });
});
