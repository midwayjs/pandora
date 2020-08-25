import mm = require('mm');
import { expect } from 'chai';
import { ProcessInfoIndicator } from '../src/ProcessIndicator';

describe('ProcessInfoIndicator', () => {
  afterEach(() => {
    mm.restore();
  });

  it('should get process info be ok', async () => {
    const ctx = {
      processName: 'testName',
    };
    const processInfoIndicator = new ProcessInfoIndicator(ctx);
    const res = await processInfoIndicator.invoke();
    expect(res.processName).to.be.equal(ctx.processName);
    expect(res.pid).to.be.ok;
    expect(res.title).to.be.ok;
    expect(res.argv).to.be.ok;
    expect(res.execArgv).to.be.ok;
    expect(res.execPath).to.be.ok;
    expect(res.cpu).to.be.ok;
    expect(res.memory).to.be.ok;
    expect(res.uptime).to.be.ok;
  });

  it('should be ok without stat from pusage', async () => {
    mm(require('pidusage'), 'stat', (pid, cb) => {
      cb(new Error('fakeError'));
    });
    const ctx = {
      processName: 'testName',
    };
    const processInfoIndicator = new ProcessInfoIndicator(ctx);
    const res = await processInfoIndicator.invoke();
    expect(res.processName).to.be.equal(ctx.processName);
    expect(res.pid).to.be.ok;
    expect(res.title).to.be.ok;
    expect(res.argv).to.be.ok;
    expect(res.execArgv).to.be.ok;
    expect(res.execPath).to.be.ok;
    expect(res.uptime).to.be.ok;
  });

  it('should be ok without stat from pusage and process.cpuUsage', async () => {
    mm(require('pidusage'), 'stat', (pid, cb) => {
      cb(new Error('fakeError'));
    });
    mm(process, 'cpuUsage', null);
    const ctx = {
      processName: 'testName',
    };
    const processInfoIndicator = new ProcessInfoIndicator(ctx);
    const res = await processInfoIndicator.invoke();
    expect(res.processName).to.be.equal(ctx.processName);
    expect(res.pid).to.be.ok;
    expect(res.title).to.be.ok;
    expect(res.argv).to.be.ok;
    expect(res.execArgv).to.be.ok;
    expect(res.execPath).to.be.ok;
    expect(res.uptime).to.be.ok;
  });
});
