import {ProcfileReconciler} from '../../src/application/ProcfileReconciler';
import {join} from 'path';
import {expect} from 'chai';
import {Service} from '../../src/domain';
import {tmpdir} from 'os';
import {readFileSync, unlinkSync} from 'fs';

const pathProjectSimple1 = join(__dirname, '../fixtures/project/simple_1');

class ProcfileReconcilerNoDefaultService extends ProcfileReconciler {
  get globalServiceInjection() {
    return [];
  }
}

describe('ProcfileReconciler', function () {

  describe('resolve', function () {
    it('should resolve procfile path set be ok', () => {
      const reconciler = new ProcfileReconciler({
        appName: 'test',
        appDir: pathProjectSimple1
      });
      expect(reconciler.resovle()).to.be.deep.include(join(pathProjectSimple1, 'procfile.js'));
    });
  });

  describe('appInfo', function () {
    it('should get appName be ok', () => {
      const reconciler = new ProcfileReconciler({
        appName: 'test',
        appDir: '-'
      });
      reconciler.callProcfile((pandora => {
        expect(pandora.appName).to.be.equal('test');
      }));
    });
    it('should get appDir be ok', () => {
      const reconciler = new ProcfileReconciler({
        appName: 'test',
        appDir: 'testdir'
      });
      reconciler.callProcfile((pandora => {
        expect(pandora.appDir).to.be.equal('testdir');
      }));
    });
  });

  describe('environment', function () {

    it('should override environment be ok', () => {
      const reconciler = new ProcfileReconciler({
        appName: 'test',
        appDir: '-'
      });

      class FakeEnv {
      }

      reconciler.callProcfile((pandora => {
        pandora.environment(FakeEnv);
      }));
      const Environment = reconciler.getEnvironment();
      expect(Environment).equal(FakeEnv);
    });
  });

  function printEmpty(data) {
  }

  describe('service', function () {

    let startCnt = 0;
    let stopCnt = 0;

    class TestService implements Service {
      static dependencies = ['depServiceA'];
      math: any;

      constructor() {
        this.math = Math;
      }

      start() {
        startCnt++;
        printEmpty(startCnt);
      }

      stop() {
        stopCnt++;
        printEmpty(stopCnt);
      }

      abs(n) {
        return this.math.abs(n);
      }
    }

    it('should inject service class be ok', () => {

      const reconciler = new ProcfileReconcilerNoDefaultService({
        appName: 'test',
        appDir: pathProjectSimple1
      });
      reconciler.callProcfile((pandora) => {
        pandora.service('TestService', TestService).dependency('baba');
      });
      const allInjectedService = reconciler.getServicesByCategory('all');

      expect(allInjectedService).to.deep.include({
        config: {},
        serviceName: 'TestService',
        category: reconciler.getDefaultServiceCategory(),
        serviceEntry: TestService,
        dependencies: ['depServiceA', 'baba']
      });

    });

    it('should inject service class, rename it, and set category, be ok', () => {
      const reconciler = new ProcfileReconcilerNoDefaultService({
        appName: 'test',
        appDir: pathProjectSimple1
      });
      reconciler.callProcfile((pandora) => {
        pandora.service('TestService', TestService).name('myVeryOwnService').process('background');
      });
      const allInjectedService = reconciler.getServicesByCategory('all');

      expect(allInjectedService).to.deep.include({
        config: {},
        serviceName: 'myVeryOwnService',
        category: 'background',
        serviceEntry: TestService,
        dependencies: [ 'depServiceA' ]
      });

    });

    it('should discover() be ok', () => {
      const reconciler = new ProcfileReconcilerNoDefaultService({
        appName: 'test',
        appDir: pathProjectSimple1
      });
      reconciler.discover();
      const allInjectedService = reconciler.getServicesByCategory('all');

      expect(allInjectedService[1]).to.contain({
        serviceName: 'myVeryOwnService',
        category: 'background'
      });

    });

    it('should inject service by relative path be ok', () => {
      const reconciler = new ProcfileReconcilerNoDefaultService({
        appName: 'test',
        appDir: pathProjectSimple1
      });
      reconciler.callProcfile((pandora) => {
        pandora.service('SomeService', './SomeService');
      }, pathProjectSimple1);
      const allInjectedService = reconciler.getServicesByCategory('all');
      expect(allInjectedService[1].serviceName).equal('SomeService');
      expect(allInjectedService[1].category).equal(reconciler.getDefaultServiceCategory());
      expect(allInjectedService[1].dependencies).to.be.deep.equal(['DepServiceBABA']);
    });

    it('should inject logger service by default be ok', () => {
      const reconciler = new ProcfileReconciler({
        appName: 'test',
        appDir: pathProjectSimple1
      });
      const allInjectedService = reconciler.getServicesByCategory('all');
      expect(allInjectedService[0].serviceName).equal('logger');
      expect(allInjectedService[0].category).equal('weak-all');
    });

  });

  describe('complex', function () {

    it('should echoComplex() be ok', () => {

      const tmpFile = join(tmpdir(), 'ProcfileReconciler.test.' + Date.now());
      ProcfileReconciler.echoComplex({
        appName: 'test',
        appDir: pathProjectSimple1
      }, tmpFile);
      const content = readFileSync(tmpFile).toString();
      unlinkSync(tmpFile);
      const rp = JSON.parse(content);
      expect(rp).to.be.ok;

    });

    it('should getComplexViaNewProcess() be ok', async () => {

      const ar = {
        appName: 'test',
        appDir: pathProjectSimple1
      };

      const complex = await ProcfileReconciler.getComplexViaNewProcess(ar);
      const reconcile = new ProcfileReconciler(ar);
      reconcile.discover();
      const complexExpect = reconcile.getComplexApplicationStructureRepresentation();
      expect(complex).to.deep.equal(complexExpect);
      expect(complex.mount.length).to.be.gte(1);

    });

  });

});

