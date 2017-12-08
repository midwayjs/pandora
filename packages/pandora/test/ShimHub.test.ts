import {Hub} from 'pandora-hub';

declare const global: {
  shimIpc: any;
} & NodeJS.Global;

describe('ShimHub', () => {
  it('should start IPC-HUB before all tests be ok', async () => {
    const ipcHub = new Hub();
    await ipcHub.start();
    global.shimIpc = ipcHub;
  });
});
