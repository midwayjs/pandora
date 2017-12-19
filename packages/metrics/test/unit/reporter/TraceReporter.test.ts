import { expect } from 'chai';
import { InfoEndPoint } from '../../../src/endpoint/impl/InfoEndPoint';
import { TraceEndPoint } from '../../../src/endpoint/impl/TraceEndPoint';
import { MetricsActuatorServer } from '../../../src/MetricsActuatorServer';
import { mockTrace } from '../../fixtures/reporter/MockTrace';
import { TraceReporter } from '../../../src/reporter/TraceReporter';
import { MetricsServerManager } from '../../../src/MetricsServerManager';
import { BaseInfoIndicator } from '../../../src/indicator/impl/BaseInfoIndicator';
const stub = require('sinon').stub;

describe.only('/test/unit/reporter/TraceReporter.test.ts', () => {
  let server;
  let reporter;

  before(() => {
    const metricsManager = new MetricsServerManager();

    server = new MetricsActuatorServer({
      metricsManager,
      config: {
        http: {
          enabled: false
        },
        endPoint: {
          trace: {
            enabled: true,
            target: TraceEndPoint,
            initConfig: {
              rate: 100
            }
          },
          info: {
            enabled: true,
            target: InfoEndPoint
          }
        }
      },
      logger: console
    });

    const indicator = new BaseInfoIndicator();
    indicator.initialize();

    reporter = new TraceReporter(server);
    reporter.start(1);
  });

  after(() => {
    reporter.stop();
    // server.stop();
    // server.destroy();
  });

  it('should collect and write trace data', (done) => {
    const endpointService = server.getEndPointService();
    const traceEndpoint = endpointService.getEndPoint('trace');
    const now = Date.now();
    const pid = process.pid;
    const trace = mockTrace(now);
    traceEndpoint.processReporter(trace);

    stub(reporter.logger, 'write').callsFake((msg) => {
      const logContent = JSON.parse(msg);
      expect(logContent.pid).to.equal(pid);
      expect(logContent.timestamp).to.equal(now);

      reporter.logger.write.restore();
      done();
    });
  });

  it('should collect from vernier time', (done) => {
    const endpointService = server.getEndPointService();
    const traceEndpoint = endpointService.getEndPoint('trace');
    const now = Date.now();
    const next = now + 5000;
    const pid = process.pid;
    const trace = mockTrace(now);
    const nextTrace = mockTrace(next);
    traceEndpoint.processReporter(trace);
    traceEndpoint.processReporter(nextTrace);
    reporter.vernier = {
      DEFAULT_APP: next
    };

    stub(reporter.logger, 'write').callsFake((msg) => {
      const logContent = JSON.parse(msg);
      expect(logContent.pid).to.equal(pid);
      expect(logContent.timestamp).to.equal(next);

      reporter.logger.write.restore();
      done();
    });
  });
});
