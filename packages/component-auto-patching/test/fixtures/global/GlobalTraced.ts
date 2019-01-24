import { Fixture } from '../../TestUtil';
import { GlobalPatcher } from '../../../src/patchers';
import { CURRENT_CONTEXT } from '../../../src/constants';
import * as sinon from 'sinon';
import * as assert from 'assert';

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
    const globalPatcher = this.autoPatching.instances.get('global');

    globalPatcher.cls.run(() => {
      globalPatcher.cls.set(CURRENT_CONTEXT, {
        traceId: '1234567890'
      });
      const stub = sinon.stub(globalPatcher, 'errorLogManager').value({
        record(data) {
          assert(data.path === 'console');
          assert(data.traceId === '1234567890');
          stub.restore();
          done();
        }
      });

      console.error('error test');
    });
  }
}