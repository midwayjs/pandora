import {MetricsActuatorManager} from '../../src/MetricsActuatorManager';
import config from '../../src/conf/default';
import {expect} from 'chai';

describe('/test/unit/MetricsActuatorManager.test.ts', () => {

  it('init actuator manager', () => {

    config['http']['enabled'] = false;

    expect(() => {
      new MetricsActuatorManager({
        logger: console,
        config: config
      });
    }).to.not.throw(TypeError);

  });
});
