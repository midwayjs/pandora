import assert = require('assert');
import {join} from 'path';
import {ProcessBootstrap} from '../../src/application/ProcessBootstrap';
import {promise} from 'pandora-dollar';

const pathToProcessBootstrapForkTimeMark = join(__dirname, '../fixtrues/application/processBootstrapForkTimeMark.js');
const pathToProcessBootstrapEntryFnTimeMark = join(__dirname, '../fixtrues/application/processBootstrapEntryFnTimeMark.js');

describe('ProcessBootstrap', function () {

  it('should fork start be ok', async () => {
    const processBootstrap = new ProcessBootstrap(pathToProcessBootstrapForkTimeMark, {
      appName: 'test',
      appDir: 'test',
      mode: 'fork'
    });
    await processBootstrap.start();
    await promise.delay(200);
    const timeMark = require(pathToProcessBootstrapForkTimeMark);
    assert(timeMark.requireTime.getTime() + 200 < Date.now());
  });

  it('should entryFn start be ok', async () => {
    const processBootstrap = new ProcessBootstrap(pathToProcessBootstrapEntryFnTimeMark, {
      appName: 'test',
      appDir: 'test',
      mode: 'procfile.js'
    });
    await processBootstrap.start();
    await promise.delay(200);
    const timeMark = require(pathToProcessBootstrapForkTimeMark);
    assert(timeMark.requireTime.getTime() + 200 < Date.now());
  });

});
