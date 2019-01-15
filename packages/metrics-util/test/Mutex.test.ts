import { expect } from 'chai';
import { Mutex } from '../src/Mutex';

describe('/test/unit/util/Mutex.test.ts', () => {
  it('test lock with no await use', async () => {
    const mutex = new Mutex();
    expect(mutex.tryLock(3000)).true;
    expect(mutex.tryLock(3000)).false;

    await new Promise(resolve => {
      mutex.wait(resolve);
    });

    await new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, 3000);
    });

    expect(mutex.waitingCount).eq(0);
  });
});
