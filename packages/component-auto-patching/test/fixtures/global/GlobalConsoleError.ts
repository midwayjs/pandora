import { Fixture } from '../../TestUtil';
import { GlobalPatcher } from '../../../src/patchers';
import * as sinon from 'sinon';
import * as assert from 'assert';
import { consoleLogger } from '@pandorajs/dollar';

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
    const errorLogManager = globalPatcher.errorLogManager;
    const stub = sinon.stub(errorLogManager, 'record').throws(new Error('collect error'));
    const spy = sinon.spy(consoleLogger, 'error');

    console.error('error test');

    assert(spy.calledWith(sinon.match('collect console error failed.')));

    stub.restore();
    spy.restore();
    done();
  }
}
