import {join} from 'path';
import {ApplicationHandler} from '../../src/application/ApplicationHandler';

const pathToForkNPM = join(__dirname, '../fixtures/project/fork_npm/');
describe('SpawnWrapShouldIgnoreNPM', function () {
  it('should be ok', async () => {
    const applicationHandler = new ApplicationHandler({
      appName: 'test',
      appDir: pathToForkNPM
    });
    await applicationHandler.start();
    await applicationHandler.stop();
  });
});
