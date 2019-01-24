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
          recordFatal: true
        }
      }
    };
  }

  async case(done) {
    const globalPatcher = this.autoPatching.instances.get('global');

    sinon.stub(globalPatcher.cls, 'get').withArgs(CURRENT_CONTEXT).returns({
      traceId: '1234567890'
    });

    const stub = sinon.stub(globalPatcher, 'errorLogManager').value({
      record(data) {
        assert(data.path === 'uncaughtException');
        assert(data.traceId === '1234567890');
        stub.restore();
        globalPatcher.cls.get.restore();
        done();
      }
    });

    setTimeout(() => {
      throw new Error('uncaughtException');
    }, 1000);
  }
}