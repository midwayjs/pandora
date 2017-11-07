import {expect} from 'chai';
import urllib = require('urllib');
import {AppletReconciler} from '../../src/application/AppletReconciler';
import {WorkerContext} from '../../src/application/WorkerContext';
import {AppletRepresentation, ProcessRepresentation} from '../../src/domain';

const SampleHTTPServer = require('../fixtures/applet/SimpleHTTPServer');

describe('AppletReconciler', function () {
  const processRepresentation: ProcessRepresentation = {
    appName: 'xxx',
    appDir: 'aaa',
    processName: 'worker',
  };
  const appletRepresentation: AppletRepresentation = {
    appletEntry: SampleHTTPServer,
    appletName: 'SampleHTTPServer'
  };
  const context = new WorkerContext(processRepresentation);
  const appletReconciler = new AppletReconciler(processRepresentation, context);

  it('should receiveAppletRepresentation() be ok', () => {
    appletReconciler.receiveAppletRepresentation(appletRepresentation);
  });

  it('should start() be ok', async () => {
    await appletReconciler.start();
    const ret = await urllib.request('http://127.0.0.1:1338/');
    expect(ret.res.data.toString()).equal('okay');
  });

  it('should stop() be ok', async () => {
    await appletReconciler.stop();
  });

});
