import {expect} from 'chai';
import {MetricsActuatorServer} from '../../src/MetricsActuatorServer';

describe('/test/unit/MetricsActuatorServer.test.ts', () => {

  it('init actuator server', () => {

    expect(() => {
      let server = new MetricsActuatorServer({
        logger: console
      });
      expect(server.getMetricsManager()).to.exist;
    }).to.not.throw(TypeError);

  });
});
