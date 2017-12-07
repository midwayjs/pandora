import {Hub} from 'pandora-hub';
describe('ShimHub', () => {
  it('should start IPC-HUB before all tests be ok', async () => {
    const ipcHub = new Hub();
    await ipcHub.start();
  });
});
