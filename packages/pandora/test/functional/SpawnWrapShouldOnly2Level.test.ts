import {join} from 'path';
import {expect} from 'chai';
import {ApplicationHandler} from '../../src/application/ApplicationHandler';
import {tmpdir} from 'os';
import {readFileSync, unlinkSync} from 'fs';

const pathToWrap2Level = join(__dirname, '../fixtures/project/wrap_2_level/');
describe('SpawnWrapShouldOnly2Level', function () {
  it('should be ok', async () => {
    const path = tmpdir() + '/pandora_test_level2.xxx';

    try {
      unlinkSync(path);
    } catch (err) {
      // Ignore
    }

    const applicationHandler = new ApplicationHandler({
      appName: 'test',
      appDir: pathToWrap2Level
    });
    await applicationHandler.start();

    await new Promise(resolve => {
      setTimeout(resolve, 5000);
    });

    const content = readFileSync(path);
    expect(content.toString()).to.be.equal('false');

    await applicationHandler.stop();
  });
});
