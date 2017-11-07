import {expect} from 'chai';
import {DefaultConfigurator} from '../../src/universal/DefaultConfigurator';
import {ProcessRepresentation} from '../../src/domain';
import {WorkerContext} from '../../src/application/WorkerContext';
import {join} from 'path';

describe('DefaultConfigurator', function () {

  const prWorker: ProcessRepresentation = {
    appName: 'xxx',
    appDir: join(__dirname, '../fixtures/universal/test-test1'),
    processName: 'worker',
  };
  const ctxWorker = new WorkerContext(prWorker);

  it('should getAllProperties() be ok', async () => {
    const defaultConfigurator = new DefaultConfigurator(ctxWorker.workerContextAccessor);
    const properties = await defaultConfigurator.getAllProperties();
    expect(properties.gotConfig).to.be.ok;
    expect(properties.gotDefault).to.be.ok;
    expect(properties.gotTest).to.be.ok;
  });

});
