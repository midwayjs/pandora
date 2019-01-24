import { Fixture } from '../../TestUtil';
import { GlobalPatcher } from '../../../src/patchers';
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
    const stub = sinon.stub(globalPatcher, 'errorLogManager').value({
      record(data) {
        assert(data.path === 'uncaughtException');
        stub.restore();
        done();
      }
    });

    setTimeout(() => { 
      throw new Error('uncaughtException');
    }, 1000);
  }
}