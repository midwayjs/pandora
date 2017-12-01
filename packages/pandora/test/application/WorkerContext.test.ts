import {expect} from 'chai';
import {WorkerContext} from '../../src/application/WorkerContext';
import mm = require('mm');

describe('WorkerContext', function () {
  const precessRepresentation = {
    processName: 'worker',
    appName: 'test',
    appDir: 'test'
  };

  it('should getEnvironment() be ok', () => {
    const workerContext = new WorkerContext(precessRepresentation);
    expect(workerContext.getEnvironment()).to.be.ok;
  });

  it('should bindService() be ok', () => {
    const workerContext = new WorkerContext(precessRepresentation);
    const receivedService = [];
    mm(workerContext, 'serviceReconciler', {
      receiveServiceRepresentation: function (service) {
        receivedService.push(service);
      }
    });
    workerContext.bindService({
      serviceEntry: null,
      serviceName: 'testService'
    });
    expect(receivedService[0].serviceName).to.be.equal('testService');
    mm.restore();
  });

  it('should bindService() by array be ok', () => {
    const workerContext = new WorkerContext(precessRepresentation);
    const receivedService = [];
    mm(workerContext, 'serviceReconciler', {
      receiveServiceRepresentation: function (service) {
        receivedService.push(service);
      }
    });
    workerContext.bindService([{
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
    const workerContext = new WorkerContext(precessRepresentation);
    let serviceDid = false;
    mm(workerContext, 'serviceReconciler', {
      start: function () {
        serviceDid = true;
      }
    });
    await workerContext.start();
    expect(serviceDid).to.be.equal(true);
    mm.restore();
  });

  it('should stop() be ok', async () => {
    const workerContext = new WorkerContext(precessRepresentation);
    let serviceDid = false;
    mm(workerContext, 'serviceReconciler', {
      stop: function () {
        serviceDid = true;
      }
    });
    await workerContext.stop();
    expect(serviceDid).to.be.equal(true);
    mm.restore();
  });

});
