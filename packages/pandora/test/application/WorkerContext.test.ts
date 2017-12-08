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
    expect(receivedService[0].serviceName).to.be.equal('testService');
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
    expect(receivedService[0].serviceName).to.be.equal('testService1');
    expect(receivedService[1].serviceName).to.be.equal('testService2');
    mm.restore();
  });



  it('should start() be ok', async () => {
    const processContext = new ProcessContext(precessRepresentation);
    let serviceDid = false;
    let hubDid = false;
    mm(processContext, 'serviceReconciler', {
      start: function () {
        serviceDid = true;
      }
    });
    mm(processContext, 'ipcHub', {
      start: function () {
        hubDid = true;
      }
    });
    await processContext.start();
    expect(serviceDid).to.be.equal(true);
    expect(hubDid).to.be.equal(true);
    mm.restore();
  });

  it('should stop() be ok', async () => {
    const processContext = new ProcessContext(precessRepresentation);
    let serviceDid = false;
    let hubDid = false;
    mm(processContext, 'serviceReconciler', {
      stop: function () {
        serviceDid = true;
      }
    });
    mm(processContext, 'ipcHub', {
      stop: function () {
        hubDid = true;
      }
    });
    await processContext.stop();
    expect(serviceDid).to.be.equal(true);
    expect(hubDid).to.be.equal(true);
    mm.restore();
  });

});
