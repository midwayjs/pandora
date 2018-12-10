import {CoreSDK} from '../src/CoreSDK';
describe('CoreSDK', function () {
  it('should start at supervisor mode be ok', async () => {
    const coreSdk = new CoreSDK({
      mode: 'supervisor',
      appName: 'test',
      appDir: process.cwd()
    });
    await coreSdk.start();
  });
  it('should start at worker mode be ok', async () => {
    const coreSdk = new CoreSDK({
      mode: 'worker',
      appName: 'test',
      appDir: process.cwd()
    });
    await coreSdk.start();
  });
});
