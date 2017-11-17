import {ProcessRepresentation, Service, ServiceRepresentation} from '../../src/domain';
import {WorkerContext} from '../../src/application/WorkerContext';
import {ServiceReconciler} from '../../src/service/ServiceReconciler';
import {expect} from 'chai';

let startCnt = 0;
let stopCnt = 0;

class SimpleService implements Service {
  math: any;

  constructor() {
    this.math = Math;
  }

  handleSubscribe(reg, fn) {
    console.log(reg, fn);
  }

  handleUnsubscribe(reg, fn) {
    console.log(reg, fn);
  }

  start() {
    startCnt++;
  }

  stop() {
    stopCnt++;
  }

  abs(n) {
    return this.math.abs(n);
  }
}

describe('ServiceReconciler', function () {

  describe('simple', () => {

    class TestServiceReconciler extends ServiceReconciler {
      get workerMode() {
        return null;
      }

      testGetService(name) {
        return this.services.get(name);
      }
    }

    const processRepresentation: ProcessRepresentation = {
      appName: 'xxx',
      appDir: 'aaa',
      processName: 'worker',
    };
    const context = new WorkerContext(processRepresentation);
    const serviceReconciler = new TestServiceReconciler(processRepresentation, context);
    const sa: ServiceRepresentation = {
      serviceName: 'testA',
      serviceEntry: SimpleService,
      dependencies: ['testB', 'testC']
    };
    const sb: ServiceRepresentation = {
      serviceName: 'testB',
      serviceEntry: SimpleService,
      dependencies: ['testC']
    };
    const sc: ServiceRepresentation = {
      serviceName: 'testC',
      serviceEntry: SimpleService,
      dependencies: ['testD']
    };
    const sd: ServiceRepresentation = {
      serviceName: 'testD',
      serviceEntry: SimpleService,
      dependencies: []
    };

    it('should receiveServiceRepresentation() be ok', async () => {
      serviceReconciler.receiveServiceRepresentation(sa);
      serviceReconciler.receiveServiceRepresentation(sb);
      serviceReconciler.receiveServiceRepresentation(sc);
      serviceReconciler.receiveServiceRepresentation(sd);
      expect(serviceReconciler.testGetService(sa.serviceName).state).equal('noinstance');
      expect(serviceReconciler.testGetService(sb.serviceName).state).equal('noinstance');
      expect(serviceReconciler.testGetService(sc.serviceName).state).equal('noinstance');
      expect(serviceReconciler.testGetService(sd.serviceName).state).equal('noinstance');
    });

    it('should getWeight() be ok', async () => {
      expect(serviceReconciler.getWeight(sa.serviceName)).equal(4);
      expect(serviceReconciler.getWeight(sb.serviceName)).equal(3);
      expect(serviceReconciler.getWeight(sc.serviceName)).equal(2);
      expect(serviceReconciler.getWeight(sd.serviceName)).equal(1);
    });

    it('should getOrderedServiceIdSet() be ok', async () => {
      expect(serviceReconciler.getOrderedServiceIdSet('asc')).to.deep.equal([
        {id: 'testD', weight: 1},
        {id: 'testC', weight: 2},
        {id: 'testB', weight: 3},
        {id: 'testA', weight: 4}
      ]);
      expect(serviceReconciler.getOrderedServiceIdSet('desc')).to.deep.equal([
        {id: 'testA', weight: 4},
        {id: 'testB', weight: 3},
        {id: 'testC', weight: 2},
        {id: 'testD', weight: 1}
      ]);
    });

    it('should instantiate() be ok', async () => {
      await serviceReconciler.instantiate();
      expect(serviceReconciler.testGetService(sa.serviceName).state).equal('instanced');
      expect(serviceReconciler.testGetService(sa.serviceName).serviceCoreInstance).to.be.ok;
      expect(serviceReconciler.testGetService(sb.serviceName).state).equal('instanced');
      expect(serviceReconciler.testGetService(sb.serviceName).serviceCoreInstance).to.be.ok;
      expect(serviceReconciler.testGetService(sc.serviceName).state).equal('instanced');
      expect(serviceReconciler.testGetService(sc.serviceName).serviceCoreInstance).to.be.ok;
      expect(serviceReconciler.testGetService(sd.serviceName).state).equal('instanced');
      expect(serviceReconciler.testGetService(sd.serviceName).serviceCoreInstance).to.be.ok;
      expect(serviceReconciler.getState()).equal('notBoot');
    });

    it('should start() be ok', async () => {
      await serviceReconciler.start();
      expect(serviceReconciler.get(sa.serviceName)).to.be.an.instanceof(SimpleService);
      expect(serviceReconciler.get(sb.serviceName)).to.be.an.instanceof(SimpleService);
      expect(serviceReconciler.get(sc.serviceName)).to.be.an.instanceof(SimpleService);
      expect(serviceReconciler.get(sd.serviceName)).to.be.an.instanceof(SimpleService);
      expect(serviceReconciler.testGetService(sa.serviceName).state).equal('booted');
      expect(serviceReconciler.testGetService(sb.serviceName).state).equal('booted');
      expect(serviceReconciler.testGetService(sc.serviceName).state).equal('booted');
      expect(serviceReconciler.testGetService(sd.serviceName).state).equal('booted');
      expect(startCnt).equal(4);
      expect(serviceReconciler.getState()).equal('booted');
    });

    it('should stop() be ok', async () => {
      await serviceReconciler.stop();
      expect(serviceReconciler.testGetService(sa.serviceName).state).equal('instanced');
      expect(serviceReconciler.testGetService(sb.serviceName).state).equal('instanced');
      expect(serviceReconciler.testGetService(sc.serviceName).state).equal('instanced');
      expect(serviceReconciler.testGetService(sd.serviceName).state).equal('instanced');
      expect(stopCnt).equal(4);
      expect(serviceReconciler.getState()).equal('notBoot');
    });

  });

});
