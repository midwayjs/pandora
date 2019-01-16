import {ReporterManager} from '../src/ReporterManager';
import {expect} from 'chai';
describe('ReporterManager', () => {

  it('should register and dispatch be ok', async () => {
    const reporterManager: ReporterManager = new ReporterManager;
    let gotData;
    reporterManager.register('test', {
      type: 'errorLog',
      async report(data) {
        gotData = data;
      }
    });
    const expectedData = ['test_data'];
    await reporterManager.dispatch('errorLog', expectedData);
    expect(gotData).to.be.equal(expectedData);
  });

  it('should avoid error when no given typed reporter has been registered', async () => {
    const reporterManager: ReporterManager = new ReporterManager;
    const expectedData = ['test_data'];
    reporterManager.register('test', {
      type: 'test',
      async report(data) {}
    });
    await reporterManager.dispatch('errorLog', expectedData);
  });

  it('should avoid error when reporter throws an error', async () => {
    const reporterManager: ReporterManager = new ReporterManager;
    const expectedData = ['test_data'];
    reporterManager.register('test', {
      type: 'errorLog',
      async report(data) {
        throw new Error('fakeError');
      }
    });
    await reporterManager.dispatch('errorLog', expectedData);
  });

});
