import {expect} from 'chai';
import {MetricsActuatorServer} from '../../src/MetricsActuatorServer';
import {MetricsServerManager} from '../../src/MetricsServerManager';

describe('/test/unit/MetricsActuatorServer.test.ts', () => {

  it('init actuator server', () => {

    expect(() => {
      let server = new MetricsActuatorServer({
        logger: console,
        metricsServer: new MetricsServerManager()
      });
      expect(server.getMetricsManager()).to.exist;
    }).to.not.throw(TypeError);

  });
});
