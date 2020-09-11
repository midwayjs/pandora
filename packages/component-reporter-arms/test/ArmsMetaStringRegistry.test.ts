import { ArmsMetaStringRegistry } from '../src/ArmsMetaStringRegistry';
import { TestArmsClient, TestArmsExportController } from './util';
import * as assert from 'assert';
import * as sinon from 'sinon';

describe('ArmsMetaStringRegistry', () => {
  const armsClient = new TestArmsClient();
  const armsExportController = new TestArmsExportController(armsClient);
  afterEach(() => {
    sinon.restore();
  });
  it('.getMetaIdForString()', async () => {
    const registry = new ArmsMetaStringRegistry('foo', armsExportController);
    const id1 = registry.getMetaIdForString('foobar');
    const id2 = registry.getMetaIdForString('foobar');
    assert(typeof id1 === 'string');
    assert(id1 === id2);
  });

  it('should upload meta strings on buffer full', async () => {
    const timer = sinon.useFakeTimers();
    const registry = new ArmsMetaStringRegistry('foo', armsExportController, 1);
    const stub = sinon.stub(armsClient, 'registerBatchStringMeta');

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
    const registry = new ArmsMetaStringRegistry('foo', armsExportController, 1);
    const stub = sinon.stub(armsClient, 'registerBatchStringMeta');

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
});
