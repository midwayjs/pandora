import {CoreSDK} from '../src/CoreSDK';
import {expect} from 'chai';
describe('CoreSDK', function () {

  it('should extendConfig works when constructing', () => {
    class TestCoreSDK extends CoreSDK {
      public loadConfigFromDefaultPlaces();
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
    class TestCoreSDK extends CoreSDK {
      public getInstance(name);
      public components;
      public coreContext;
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

    class TestCoreSDK extends CoreSDK {
      public addComponent(component);
      public getStartQueue();
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

  // it('should start at supervisor mode be ok', async () => {
  //   const coreSdk = new CoreSDK({
  //     mode: 'supervisor',
  //     appName: 'test',
  //     appDir: process.cwd()
  //   });
  //   await coreSdk.start();
  // });
  // it('should start at worker mode be ok', async () => {
  //   const coreSdk = new CoreSDK({
  //     mode: 'worker',
  //     appName: 'test',
  //     appDir: process.cwd()
  //   });
  //   await coreSdk.start();
  // });
});
