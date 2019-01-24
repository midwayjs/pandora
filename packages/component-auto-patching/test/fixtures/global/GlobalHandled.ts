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
          recordConsole: true,
          recordUnhandled: true
        }
      }
    };
  }

  async case(done) {
    const globalPatcher = this.autoPatching.instances.get('global');
    const stub = sinon.stub(globalPatcher, 'errorLogManager').value({
      record(data) {
        assert(data.path === 'console');
        done();
      }
    });

    process.on('unhandledRejection', (error) => {
      console.error('handle error: ', error);
      stub.restore();
    });

    new Promise((resolve, reject) => {
      reject(new Error('promise error'));
    });
  }
}