import {expect} from 'chai';
import {WorkerContext} from '../../src/application/WorkerContext';
import mm = require('mm');

describe('WorkerContext', function () {
  const precessRepresentation = {
    processName: 'worker',
    appName: 'test',
    appDir: 'test'
  };
  const myVeryOwnProperties = {
    a: 1,
    b: 'test'
  };

  class MyVeryOwnConfigurator {
    getAllProperties() {
      return myVeryOwnProperties;
    }
  }

  it('should setConfigurator() getConfigurator() and getProperties() be ok', async () => {
    const workerContext = new WorkerContext(precessRepresentation);
    await workerContext.setConfigurator(new MyVeryOwnConfigurator());
    expect(workerContext.getConfigurator().getAllProperties()).to.be.deep.equal(myVeryOwnProperties);
    expect(workerContext.getProperties()).to.be.deep.equal(myVeryOwnProperties);
  });

  it('should workerContextAccessor.config be ok', async () => {
    const workerContext = new WorkerContext(precessRepresentation);
    await workerContext.setConfigurator(new MyVeryOwnConfigurator());
    expect(workerContext.workerContextAccessor.config).to.be.deep.equal(myVeryOwnProperties);
  });

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

  it('should bindApplet() be ok', () => {
    const workerContext = new WorkerContext(precessRepresentation);
    const receivedApplet = [];
    mm(workerContext, 'appletReconciler', {
      receiveAppletRepresentation: function (applet) {
        receivedApplet.push(applet);
      }
    });
    workerContext.bindApplet({
      appletEntry: null,
      appletName: 'testApplet'
    });
    expect(receivedApplet[0].appletName).to.be.equal('testApplet');
    mm.restore();
  });

  it('should bindApplet() by array be ok', () => {
    const workerContext = new WorkerContext(precessRepresentation);
    const receivedApplet = [];
    mm(workerContext, 'appletReconciler', {
      receiveAppletRepresentation: function (applet) {
        receivedApplet.push(applet);
      }
    });
    workerContext.bindApplet([{
      appletEntry: null,
      appletName: 'testApplet1'
    }, {
      appletEntry: null,
      appletName: 'testApplet2'
    }]);
    expect(receivedApplet[0].appletName).to.be.equal('testApplet1');
    expect(receivedApplet[1].appletName).to.be.equal('testApplet2');
    mm.restore();
  });

  it('should start() be ok', async () => {
    const workerContext = new WorkerContext(precessRepresentation);
    let appletDid = false;
    let serviceDid = false;
    mm(workerContext, 'appletReconciler', {
      start: function () {
        appletDid = true;
      }
    });
    mm(workerContext, 'serviceReconciler', {
      start: function () {
        serviceDid = true;
      }
    });
    await workerContext.start();
    expect(appletDid).to.be.equal(true);
    expect(serviceDid).to.be.equal(true);
    mm.restore();
  });

  it('should stop() be ok', async () => {
    const workerContext = new WorkerContext(precessRepresentation);
    let appletDid = false;
    let serviceDid = false;
    mm(workerContext, 'appletReconciler', {
      stop: function () {
        appletDid = true;
      }
    });
    mm(workerContext, 'serviceReconciler', {
      stop: function () {
        serviceDid = true;
      }
    });
    await workerContext.stop();
    expect(appletDid).to.be.equal(true);
    expect(serviceDid).to.be.equal(true);
    mm.restore();
  });

});
