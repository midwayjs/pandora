import { ArmsMetaStringRegistry } from '../src/ArmsMetaStringRegistry';
import {
  TestArmsMetaDataRegister,
  TestArmsServiceRegister,
  TestArmsExportController,
} from './util';
import * as assert from 'assert';
import * as sinon from 'sinon';

describe('ArmsMetaStringRegistry', () => {
  const armsMetadataRegister = new TestArmsMetaDataRegister();
  const armsServiceRegister = new TestArmsServiceRegister();
  const armsExportController = new TestArmsExportController(
    armsServiceRegister,
    armsMetadataRegister
  );
  afterEach(() => {
    sinon.restore();
  });
  it('.getMetaIdForString()', async () => {
    await armsExportController.register();
    const registry = new ArmsMetaStringRegistry('foo', armsExportController);
    const id1 = registry.getMetaIdForString('foobar');
    const id2 = registry.getMetaIdForString('foobar');
    assert(typeof id1 === 'string');
    assert(id1 === id2);
  });

  it('should upload meta strings on buffer full', async () => {
    const timer = sinon.useFakeTimers();
    await armsExportController.register();
    const registry = new ArmsMetaStringRegistry('foo', armsExportController, 1);
    const stub = sinon.stub(armsMetadataRegister, 'registerBatchStringMeta');

    const foobarId = registry.getMetaIdForString('foobar');
    await timer.tickAsync(1);
    assert.strictEqual(stub.args.length, 1);
    const [batch] = stub.args[0];
    // TODO: batch validation;
    assert(!registry['pendingIds'].has(foobarId));
    assert(registry['registeringIds'].has(foobarId));

    stub.yield(null, { success: true });
    await timer.tickAsync(1);
    assert(!registry['pendingIds'].has(foobarId));
    assert(!registry['registeringIds'].has(foobarId));
    assert(registry['registeredIds'].has(foobarId));

    // no new calls committed for registered meta string.
    registry.getMetaIdForString('foobar');
    await timer.tickAsync(1);
    assert.strictEqual(stub.args.length, 1);
    assert(!registry['pendingIds'].has(foobarId));
    assert(!registry['registeringIds'].has(foobarId));

    stub.yield(null, { success: true });
    await timer.tickAsync(1);
    assert(!registry['pendingIds'].has(foobarId));
    assert(!registry['registeringIds'].has(foobarId));
    assert(registry['registeredIds'].has(foobarId));
  });

  it('should not upload during another upload', async () => {
    const timer = sinon.useFakeTimers();
    await armsExportController.register();
    const registry = new ArmsMetaStringRegistry('foo', armsExportController, 1);
    const stub = sinon.stub(armsMetadataRegister, 'registerBatchStringMeta');

    const foobarId = registry.getMetaIdForString('foobar');
    await timer.tickAsync(1);
    assert.strictEqual(stub.args.length, 1);
    const [batch] = stub.args[0];
    // TODO: batch validation;

    // no new calls committed for registered meta string.
    const foobarId2 = registry.getMetaIdForString('foobar2');
    await timer.tickAsync(1);
    assert.strictEqual(stub.args.length, 1);

    stub.yield(null, { success: true });
    await timer.tickAsync(1);
    assert(registry['registeredIds'].has(foobarId));
    assert(!registry['registeredIds'].has(foobarId2));

    stub.yield(null, { success: true });
    await timer.tickAsync(1);
    assert(!registry['registeredIds'].has(foobarId2));

    // no new calls committed for registered meta string.
    const foobarId3 = registry.getMetaIdForString('foobar3');
    await timer.tickAsync(1);
    assert.strictEqual(stub.args.length, 2);

    stub.yield(null, { success: true });
    await timer.tickAsync(1);
    assert(registry['registeredIds'].has(foobarId3));
  });

  it('should re-buffer failed uploads', async () => {
    const timer = sinon.useFakeTimers();

    const registerBatchStringMetaStub = sinon.stub(
      armsMetadataRegister,
      'registerBatchStringMeta'
    );

    const registry = new ArmsMetaStringRegistry('foo', armsExportController, 1);

    armsServiceRegister.setFailure(true);
    await armsExportController.register();

    const foobarId = registry.getMetaIdForString('foobar');
    await timer.tickAsync(1);
    assert.strictEqual(registerBatchStringMetaStub.callCount, 0);
    assert(!registry['registeredIds'].has(foobarId));

    armsServiceRegister.setFailure(false);
    await armsExportController.register();

    // trigger new registration
    const foobarId2 = registry.getMetaIdForString('foobar2');
    await timer.tickAsync(1);
    assert.strictEqual(registerBatchStringMetaStub.args.length, 1);

    registerBatchStringMetaStub.yield(null, { success: true });
    await timer.tickAsync(1);
    assert(registry['registeredIds'].has(foobarId));
    assert(registry['registeredIds'].has(foobarId2));
  });
});
