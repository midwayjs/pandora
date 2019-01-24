import { Fixture } from '../../TestUtil';
import { GlobalPatcher } from '../../../src/patchers';
import * as sinon from 'sinon';
import * as assert from 'assert';
import * as pedding from 'pedding';

export default class GlobalFixture extends Fixture {

  config() {

    return {
      patchers: {
        global: {
          enabled: true,
          klass: GlobalPatcher,
          recordConsole: true
        }
      }
    };
  }

  async case(done) {
    const _done = pedding(done, 3);

    const globalPatcher = this.autoPatching.instances.get('global');
    let index = 1;
    const stub = sinon.stub(globalPatcher, 'errorLogManager').value({
      record(data) {
        assert(data.path === 'console');
        index ++;
        if (index === 4) {
          stub.restore();
        }
        _done();
      }
    });

    console.error('error test');
    console.warn('warn test');

    new Promise((resolve, reject) => {
      reject(new Error('promise error'));
    });
  }
}