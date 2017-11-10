import {ProcfileReconciler} from '../../src/application/ProcfileReconciler';
import {join} from 'path';
import {expect} from 'chai';
import {Service} from '../../src/domain';

import globalConfig from '../../src/default';
const pathProjectSimple1 = join(__dirname, '../fixtures/project/simple_1');

class TestApplet {
  start() {
    console.log('start');
  }

  stop() {
    console.log('stop');
  }
}

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
    it('should get environment default by global config be ok', () => {
      const reconciler = new ProcfileReconciler({
        appName: 'test',
        appDir: '-'
      });
      const Environment = reconciler.getEnvironment();
      expect(Environment).equal(globalConfig.environment);
    });
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

  describe('configurator', function () {
    it('should inject configurator be ok', () => {
      const reconciler = new ProcfileReconciler({
        appName: 'test',
        appDir: '-'
      });

      class FakeConfigurator {
      }

      reconciler.callProcfile((pandora => {
        pandora.configurator(FakeConfigurator);
      }));
      const Configurator = reconciler.getConfigurator();
      expect(Configurator).equal(FakeConfigurator);
    });
  });

  describe('applet', function () {

    it('should inject applet class be ok', () => {
      const reconciler = new ProcfileReconciler({
        appName: 'test',
        appDir: pathProjectSimple1
      });
      reconciler.callProcfile((pandora) => {
        pandora.applet(TestApplet);
      });
      const allInjectedApplets = reconciler.getAppletsByCategory('all');
      expect(allInjectedApplets[0].appletEntry).equal(TestApplet);
      expect(allInjectedApplets[0].appletName).equal('TestApplet');
      expect(allInjectedApplets[0].category).equal('worker');
    });

    it('should inject applet class, rename it, and set category, be ok', () => {
      const reconciler = new ProcfileReconciler({
        appName: 'test',
        appDir: pathProjectSimple1
      });
      reconciler.callProcfile((pandora) => {
        pandora.applet(TestApplet).name('myVeryOwnApplet').process('background');
      });
      const allInjectedApplets = reconciler.getAppletsByCategory('all');
      expect(allInjectedApplets[0].appletEntry).equal(TestApplet);
      expect(allInjectedApplets[0].appletName).equal('myVeryOwnApplet');
      expect(allInjectedApplets[0].category).equal('background');
    });

    it('should discover() be ok', () => {
      const reconciler = new ProcfileReconciler({
        appName: 'test',
        appDir: pathProjectSimple1
      });
      reconciler.discover();
      const allInjectedApplets = reconciler.getAppletsByCategory('all');
      expect(allInjectedApplets[0].appletName).equal('myVeryOwnApplet');
      expect(allInjectedApplets[0].category).equal('background');
    });

    it('should inject applet by relative path be ok', () => {
      const reconciler = new ProcfileReconciler({
        appName: 'test',
        appDir: pathProjectSimple1
      });
      reconciler.callProcfile((pandora) => {
        pandora.applet('./SomeApplet');
      }, pathProjectSimple1);
      const allInjectedApplets = reconciler.getAppletsByCategory('all');
      const someApplet = new (<any> allInjectedApplets[0].appletEntry);
      expect(someApplet.passTestCase()).to.be.ok;
      expect(allInjectedApplets[0].appletName).equal('SomeApplet');
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
        pandora.service(TestService).dependency('baba');
      });
      const allInjectedService = reconciler.getServicesByCategory('all');
      expect(allInjectedService[0].serviceName).equal('TestService');
      expect(allInjectedService[0].category).equal('all');
      expect(allInjectedService[0].serviceEntry).equal(TestService);
      expect(allInjectedService[0].dependencies).to.be.deep.equal(['depServiceA', 'baba']);
    });


    it('should inject service class, rename it, and set category, be ok', () => {
      const reconciler = new ProcfileReconcilerNoDefaultService({
        appName: 'test',
        appDir: pathProjectSimple1
      });
      reconciler.callProcfile((pandora) => {
        pandora.service(TestService).name('myVeryOwnService').process('background');
      });
      const allInjectedService = reconciler.getServicesByCategory('all');
      expect(allInjectedService[0].serviceEntry).equal(TestService);
      expect(allInjectedService[0].serviceName).equal('myVeryOwnService');
      expect(allInjectedService[0].category).equal('background');
    });


    it('should discover() be ok', () => {
      const reconciler = new ProcfileReconcilerNoDefaultService({
        appName: 'test',
        appDir: pathProjectSimple1
      });
      reconciler.discover();
      const allInjectedService = reconciler.getServicesByCategory('all');
      expect(allInjectedService[0].serviceName).equal('myVeryOwnService');
      expect(allInjectedService[0].category).equal('background');
    });

    it('should inject service by relative path be ok', () => {
      const reconciler = new ProcfileReconcilerNoDefaultService({
        appName: 'test',
        appDir: pathProjectSimple1
      });
      reconciler.callProcfile((pandora) => {
        pandora.service('./SomeService');
      }, pathProjectSimple1);
      const allInjectedService = reconciler.getServicesByCategory('all');
      expect(allInjectedService[0].serviceName).equal('SomeService');
      expect(allInjectedService[0].category).equal('all');
      expect(allInjectedService[0].dependencies).to.be.deep.equal(['DepServiceBABA']);
    });

    it('should inject logger service by default be ok', () => {
      const reconciler = new ProcfileReconciler({
        appName: 'test',
        appDir: pathProjectSimple1
      });
      const allInjectedService = reconciler.getServicesByCategory('all');
      expect(allInjectedService[0].serviceName).equal('logger');
      expect(allInjectedService[0].category).equal('all');
    });

  });

});

