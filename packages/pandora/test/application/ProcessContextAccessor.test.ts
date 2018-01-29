import {ProcessContextAccessor} from '../../src/application/ProcessContextAccessor';
import {ProcessContext} from '../../src/application/ProcessContext';
import {expect} from 'chai';
import mm = require('mm');

describe('ProcessContextAccessor', function () {

  const precessRepresentation = {
    processName: 'worker',
    appName: 'test',
    appDir: 'test'
  };

  it('should get appName be ok', () => {
    const processContext = new ProcessContext(precessRepresentation);
    const accessor = new ProcessContextAccessor(processContext);
    expect(accessor.appName).to.equal('test');
  });

  it('should get appDir be ok', () => {
    const processContext = new ProcessContext(precessRepresentation);
    const accessor = new ProcessContextAccessor(processContext);
    expect(accessor.appDir).to.equal('test');
  });

  it('should get processName be ok', () => {
    const processContext = new ProcessContext(precessRepresentation);
    const accessor = new ProcessContextAccessor(processContext);
    expect(accessor.processName).to.equal('worker');
  });

  it('should get env be ok', () => {
    const processContext = new ProcessContext(precessRepresentation);
    const accessor = new ProcessContextAccessor(processContext);
    expect(accessor.env).to.equal('test');
  });

  it('should get environment be ok', async () => {
    const processContext = new ProcessContext(precessRepresentation);
    const accessor = new ProcessContextAccessor(processContext);
    expect(accessor.environment).to.be.ok;
  });

  it('should getService() be ok', async () => {
    const processContext = new ProcessContext(precessRepresentation);
    const accessor = new ProcessContextAccessor(processContext);
    mm(processContext, 'serviceReconciler', {
      get: function (name) {
        if (name === 'service-test') {
          return {
            serviceTest: true
          };
        }
      }
    });
    const instance = accessor.getService<any>('service-test');
    expect(instance.serviceTest).to.equal(true);
    mm.restore();
  });

  it('should getServiceClass() be ok', async () => {
    const processContext = new ProcessContext(precessRepresentation);
    const accessor = new ProcessContextAccessor(processContext);
    mm(processContext, 'serviceReconciler', {
      getServiceClass: function (name) {
        if (name === 'service-class-test') {
          return {
            serviceClassTest: true
          };
        }
      }
    });
    const klass: any = accessor.getServiceClass('service-class-test');
    expect(klass.serviceClassTest).to.equal(true);
    mm.restore();
  });

  it('should getHub() be ok', async () => {
    const processContext = new ProcessContext(precessRepresentation);
    const accessor = new ProcessContextAccessor(processContext);
    let times = 0;
    mm(processContext, 'getIPCHub', () => {
      times++;
    });
    accessor.getHub();
    expect(times).to.equal(1);
    mm.restore();
  });

  it('should getProxy() be ok', async () => {

    const processContext = new ProcessContext(precessRepresentation);
    const accessor = new ProcessContextAccessor(processContext);
    let times = 0;

    mm(processContext, 'getIPCHub', () => {
      return {
        getProxy(objDesc) {
          times++;
          expect(objDesc.name).to.equal('nameValue');
        }
      };
    });

    await accessor.getProxy('nameValue');
    await accessor.getProxy({name: 'nameValue'});
    expect(times).to.equal(2);

    mm.restore();

  });

});
