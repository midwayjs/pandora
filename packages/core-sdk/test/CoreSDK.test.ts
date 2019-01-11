import {CoreSDK} from '../src/CoreSDK';
import {expect} from 'chai';
import {unlinkSync, writeFileSync} from 'fs';
import {IComponentConstructor} from 'pandora-component-decorator';
describe('CoreSDK', function () {

  it('should extendContext works when constructing', () => {
    class TestCoreSDK extends CoreSDK {
      public coreContext;
    }
    const opts = {
      mode: 'worker',
      appName: 'test',
      appDir: 'test',
      extendContext: {
        papa: 1
      }
    };
    const sdk = new TestCoreSDK(opts);
    expect(sdk.coreContext.papa).to.be.equal(1);
  });

  it('should getInstance() be ok', () => {
    class TestCoreSDK extends CoreSDK { }
    interface TestCoreSDK {
      getInstance(name);
      components;
      coreContext;
    }
    const sdk = new TestCoreSDK({ mode: 'worker', appName: 'test', appDir: 'test' });
    class TestClass {
      constructor(ctx) {
        expect(ctx).to.be.equal(sdk.coreContext);
        expect(ctx).to.includes({
          mode: 'worker',
          appName: 'test',
          appDir: 'test',
          processName: 'worker',
        });
      }
    }
    sdk.components.set('pa', {
      name: 'pa',
      path: 'pa',
      klass: TestClass
    });
    const instance = sdk.getInstance('pa');
    expect(instance).an.instanceof(TestClass);
    expect(sdk.getInstance('pa')).to.be.equal(instance);
  });

  it('should getStartQueue() be ok', () => {
    class TestCoreSDK extends CoreSDK { }
    interface TestCoreSDK {
      addComponent(component);
      getStartQueue();
    }
    const sdk = new TestCoreSDK({ mode: 'worker', appName: 'test', appDir: 'test' });
    sdk.addComponent( { name: 'a', path: 'a', klass: null, dependencies: ['b'] } );
    sdk.addComponent( { name: 'b', path: 'b', klass: null } );
    sdk.addComponent( { name: 'c', path: 'c', klass: null, dependencies: ['a'] } );
    expect(sdk.getStartQueue()).to.deep.equal([
      { name: 'b', weight: 1 },
      { name: 'a', weight: 2 },
      { name: 'c', weight: 3 },
    ]);
  });

  it('should getStopQueue() be ok', () => {
    class TestCoreSDK extends CoreSDK { }
    interface TestCoreSDK {
      addComponent(component);
      getStopQueue();
    }
    const sdk = new TestCoreSDK({ mode: 'worker', appName: 'test', appDir: 'test' });
    sdk.addComponent( { name: 'a', path: 'a', klass: null, dependencies: ['b'] } );
    sdk.addComponent( { name: 'b', path: 'b', klass: null } );
    sdk.addComponent( { name: 'c', path: 'c', klass: null, dependencies: ['a'] } );
    expect(sdk.getStopQueue()).to.deep.equal([
      { name: 'c', weight: 3 },
      { name: 'a', weight: 2 },
      { name: 'b', weight: 1 },
    ]);
  });

  it('should loadConfig() be ok', () => {
    class TestCoreSDK extends CoreSDK { }
    interface TestCoreSDK {
      loadConfig(extConfig: any, configDir: string, reverseExtend?: boolean);
    }
    const sdk = new TestCoreSDK({ mode: 'worker', appName: 'test', appDir: 'test' });
    sdk.loadConfig({
      a: {
        b: {
          c: 1
        }
      },
      components: {
        papa: {
          path: 'papa'
        }
      }
    }, '/baba');

    expect(sdk.config.a.b.c).to.be.equal(1);
    expect(sdk.config.components.papa.path).to.be.equal('papa');
    expect(sdk.config.components.papa.configDir).to.be.equal('/baba');

    sdk.loadConfig({
      a: {
        b: {
          c: 2,
          d: 2
        }
      },
      components: {
        papa: {
          path: 'papa'
        },
        caca: {
          path: 'caca'
        }
      }
    }, '/lala', true);

    expect(sdk.config.a.b.c).to.be.equal(1);
    expect(sdk.config.a.b.d).to.be.equal(2);
    expect(sdk.config.components.papa.path).to.be.equal('papa');
    expect(sdk.config.components.papa.configDir).to.be.equal('/baba');
    expect(sdk.config.components.caca.path).to.be.equal('caca');
    expect(sdk.config.components.caca.configDir).to.be.equal('/lala');

  });

  it('should loadConfigFromDefaultPlaces() be ok', () => {
    writeFileSync('./pandoraConfig.js', 'module.exports = { test: 1 }');
    const allConfigDirs = {};
    class TestCoreSDK extends CoreSDK {
      public loadConfig(extConfig: any, configDir: string, reverseExtend: boolean = false) {
        expect(reverseExtend).to.be.equal(false);
        allConfigDirs[configDir] = extConfig;
      }
    }
    interface TestCoreSDK {
      loadConfigFromDefaultPlaces();
    }
    const sdk = new TestCoreSDK({ mode: 'worker', appName: 'test', appDir: 'test' });
    sdk.loadConfigFromDefaultPlaces();
    unlinkSync('./pandoraConfig.js');
    expect(allConfigDirs[process.cwd()].test).to.be.equal(1);
  });

  it('should extendConfig works when constructing', () => {
    class TestCoreSDK extends CoreSDK { }
    interface TestCoreSDK {
      loadConfigFromDefaultPlaces();
    }
    const opts = {
      mode: 'worker',
      appName: 'test',
      appDir: 'test',
      extendConfig: [
        {
          config: {
            extConfig: 1
          },
          configDir: '/etc/config/'
        },
      ]
    };
    const sdk = new TestCoreSDK(opts);
    sdk.loadConfigFromDefaultPlaces();
    expect(sdk.config.extConfig).to.be.equal(1);
  });

  it('should loadComponentsFromConfig() be ok', () => {

    class TestCoreSDK extends CoreSDK {
      public components;
    }
    interface TestCoreSDK {
       loadComponentsFromConfig();
    }
    const sdk = new TestCoreSDK({ mode: 'worker', appName: 'test', appDir: 'test' });
    sdk.loadComponentsFromConfig();
    expect(sdk.components.get('actuatorServer').klass).to.be.equal(require('pandora-component-actuator-server').default);
    expect(sdk.components.get('ipcHub').klass).to.be.equal(require('pandora-component-ipc-hub').default);

  });

  it('should start / stop at supervisor mode be ok', async () => {

    const startOrder = [];
    const stopOrder = [];

    class TestComponent1 {
      startAtSupervisor() {
        startOrder.push(1);
      }
      stopAtSupervisor() {
        stopOrder.push(1);
      }
    }

    class TestComponent2 {
      startAtSupervisor() {
        startOrder.push(2);
      }
      stopAtSupervisor() {
        stopOrder.push(2);
      }
    }

    class TestCoreSDK extends CoreSDK {
      public loadConfigFromDefaultPlaces() {
        this.addComponent({ name: 'test1', path: 'test1', klass: <IComponentConstructor> <any> TestComponent1, dependencies: ['test2'] });
        this.addComponent({ name: 'test2', path: 'test2', klass: <IComponentConstructor> <any> TestComponent2, dependencies: []});
      }
    }
    const sdk = new TestCoreSDK({ mode: 'supervisor', appName: 'test', appDir: 'test' });
    sdk.config.components = {};
    await sdk.start();
    expect(startOrder).to.deep.equal([2, 1]);
    await sdk.stop();
    expect(stopOrder).to.deep.equal([1, 2]);

  });

  it('should start / stop at worker mode be ok', async () => {

    const startOrder = [];
    const stopOrder = [];

    class TestComponent1 {
      start() {
        startOrder.push(1);
      }
      stop() {
        stopOrder.push(1);
      }
    }

    class TestComponent2 {
      start() {
        startOrder.push(2);
      }
      stop() {
        stopOrder.push(2);
      }
    }

    class TestCoreSDK extends CoreSDK {
      public loadConfigFromDefaultPlaces() {
        this.addComponent({ name: 'test1', path: 'test1', klass: <IComponentConstructor> <any> TestComponent1, dependencies: ['test2'] });
        this.addComponent({ name: 'test2', path: 'test2', klass: <IComponentConstructor> <any> TestComponent2, dependencies: []});
      }
    }
    const sdk = new TestCoreSDK({ mode: 'worker', appName: 'test', appDir: 'test' });
    sdk.config.components = {};
    await sdk.start();
    expect(startOrder).to.deep.equal([2, 1]);
    await sdk.stop();
    expect(stopOrder).to.deep.equal([1, 2]);

  });

});
