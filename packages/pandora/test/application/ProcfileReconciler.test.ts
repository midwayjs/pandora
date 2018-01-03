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
        expect(pandora.appName).to.equal('test');
      }));
    });
    it('should get appDir be ok', () => {
      const reconciler = new ProcfileReconciler({
        appName: 'test',
        appDir: 'testdir'
      });
      reconciler.callProcfile((pandora => {
        expect(pandora.appDir).to.equal('testdir');
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

    it('should dropServiceByName() be ok', () => {

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
      reconciler.callProcfile((pandora) => {
        pandora.service('TestService').drop();
      });
      const allInjectedService2 = reconciler.getServicesByCategory('all');
      expect(allInjectedService2.length).to.equal(allInjectedService.length - 1);

    });

  });

  describe('new standard ( process )', function () {


    it('should be ok without fork()', async () => {
      const reconciler = new ProcfileReconciler({
        appName: 'test',
        appDir: '-'
      });
      reconciler.callProcfile((pandora) => {
        pandora.process('a');
        pandora.process('b');
        pandora.service('serviceA', class ServiceA {}).process('a');
        pandora.service('serviceB', class ServiceA {}).process('b');
      });
      const appStruc = reconciler.getApplicationStructure();
      expect(appStruc.process.length).to.be.eq(2);
    });

    it('should be ok with fork()', async () => {
      const reconciler = new ProcfileReconciler({
        appName: 'test',
        appDir: '-'
      });
      reconciler.callProcfile((pandora) => {
        pandora.process('a');
        pandora.process('b');
        pandora.fork('c', './true');
        pandora.service('serviceA', class ServiceA {}).process('a');
        pandora.service('serviceB', class ServiceA {}).process('b');
      });
      const appStruc = reconciler.getApplicationStructure();
      expect(appStruc.process.length).to.be.eq(3);
    });

    it('should dropProcess() be ok', async () => {
      const reconciler = new ProcfileReconciler({
        appName: 'test',
        appDir: '-'
      });
      reconciler.callProcfile((pandora) => {
        pandora.process('a');
      });
      expect(reconciler.getProcessByName('a')).to.be.ok;
      reconciler.callProcfile((pandora) => {
        pandora.process('a').drop();
      });
      expect(reconciler.getProcessByName('a')).to.be.not.ok;
    });

  });

  describe('structure', function () {

    it('should echoStructure() be ok', () => {

      const tmpFile = join(tmpdir(), 'ProcfileReconciler.test.' + Date.now());
      ProcfileReconciler.echoStructure({
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

      const structureRepresentation = await ProcfileReconciler.getStructureViaNewProcess(ar);
      const reconcile = new ProcfileReconciler(ar);
      reconcile.discover();
      const structureRepresentation2 = reconcile.getApplicationStructure();
      expect(structureRepresentation).to.deep.equal(structureRepresentation2);
      expect(structureRepresentation.process.length).to.be.gte(1);

    });

  });

});

