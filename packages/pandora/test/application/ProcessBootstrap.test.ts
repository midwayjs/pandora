import {ProcessBootstrap} from '../../src/application/ProcessBootstrap';
import {join} from 'path';


const pathProjectSimple1 = join(__dirname, '../fixtures/project/simple_1');

describe('ProcessBootstrap', function () {

  it('should start by procfile.js mode be ok', async () => {
    const processBootstrap = new ProcessBootstrap({
      processName: 'background',
      appName: 'test',
      appDir: pathProjectSimple1
    });
    await processBootstrap.start();

    // TODO: Replace to Service
    // const appletReconciler = processBootstrap.context.appletReconciler;
    // const applet = <any> appletReconciler.getAppletInstance('myVeryOwnApplet');
    // assert(applet.passTestCase());
    // const applet2 = <any> appletReconciler.getAppletInstance('configApplet');
    // assert(applet2.getConfig().simple1 === true);
  });

});
