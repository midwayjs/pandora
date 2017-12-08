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
    expect(accessor.appName).to.be.equal('test');
  });

  it('should get appDir be ok', () => {
    const processContext = new ProcessContext(precessRepresentation);
    const accessor = new ProcessContextAccessor(processContext);
    expect(accessor.appDir).to.be.equal('test');
  });

  it('should get processName be ok', () => {
    const processContext = new ProcessContext(precessRepresentation);
    const accessor = new ProcessContextAccessor(processContext);
    expect(accessor.processName).to.be.equal('worker');
  });

  it('should get env be ok', () => {
    const processContext = new ProcessContext(precessRepresentation);
    const accessor = new ProcessContextAccessor(processContext);
    expect(accessor.env).to.be.equal('test');
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
    expect(instance.serviceTest).to.be.equal(true);
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
    expect(klass.serviceClassTest).to.be.equal(true);
    mm.restore();
  });

});
