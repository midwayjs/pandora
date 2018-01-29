import {expect} from 'chai';
import {ProcessContext} from '../../src/application/ProcessContext';
import mm = require('mm');

describe('ProcessContext', function () {
  const precessRepresentation = {
    processName: 'worker',
    appName: 'test',
    appDir: 'test'
  };

  it('should getEnvironment() be ok', () => {
    const processContext = new ProcessContext(precessRepresentation);
    expect(processContext.getEnvironment()).to.be.ok;
  });

  it('should bindService() be ok', () => {
    const processContext = new ProcessContext(precessRepresentation);
    const receivedService = [];
    mm(processContext, 'serviceReconciler', {
      receiveServiceRepresentation: function (service) {
        receivedService.push(service);
      }
    });
    processContext.bindService({
      serviceEntry: null,
      serviceName: 'testService'
    });
    expect(receivedService[0].serviceName).to.equal('testService');
    mm.restore();
  });

  it('should bindService() by array be ok', () => {
    const processContext = new ProcessContext(precessRepresentation);
    const receivedService = [];
    mm(processContext, 'serviceReconciler', {
      receiveServiceRepresentation: function (service) {
        receivedService.push(service);
      }
    });
    processContext.bindService([{
      serviceEntry: null,
      serviceName: 'testService1'
    }, {
      serviceEntry: null,
      serviceName: 'testService2'
    }]);
    expect(receivedService[0].serviceName).to.equal('testService1');
    expect(receivedService[1].serviceName).to.equal('testService2');
    mm.restore();
  });

  it('should getIPCHub() be ok', () => {
    const processContext = new ProcessContext(precessRepresentation);
    const once = processContext.getIPCHub();
    const twice = processContext.getIPCHub();
    expect(once).to.be.ok;
    expect(once).to.equal(twice);
  });


  it('should start() be ok', async () => {
    const processContext = new ProcessContext(precessRepresentation);
    let serviceDid = false;
    mm(processContext, 'serviceReconciler', {
      start: function () {
        serviceDid = true;
      }
    });
    await processContext.start();
    expect(serviceDid).to.equal(true);
    mm.restore();
  });

  it('should stop() be ok', async () => {
    const processContext = new ProcessContext(precessRepresentation);
    let serviceDid = false;
    mm(processContext, 'serviceReconciler', {
      stop: function () {
        serviceDid = true;
      }
    });
    await processContext.stop();
    expect(serviceDid).to.equal(true);
    mm.restore();
  });

});
