// import { expect } from 'chai';
import { stub } from 'sinon';
import { InfoEndPoint } from '../../../src/endpoint/impl/InfoEndPoint';
import { TraceEndPoint } from '../../../src/endpoint/impl/TraceEndPoint';
import { MetricsActuatorServer } from '../../../src/MetricsActuatorServer';
import { mockTrace } from '../../fixtures/reporter/MockTrace';
import { TraceReporter } from '../../../src/reporter/TraceReporter';

describe.only('/test/unit/reporter/TraceReporter.test.ts', () => {
  let server;
  let reporter;

  before(() => {
    server = new MetricsActuatorServer({
      config: {
        http: {
          enabled: false
        },
        endPoints: {
          trace: {
            enabled: true,
            target: TraceEndPoint
          },
          info: {
            enabled: true,
            target: InfoEndPoint
          }
        }
      },
      logger: console
    });

    reporter = new TraceReporter(server);
    reporter.start(1);
  });

  it('should collect and write trace data', (done) => {
    const endpointService = server.getEndPointService();
    const traceEndpoint = endpointService.getEndPoint('trace');
    const now = Date.now();
    // const pid = process.pid;

    traceEndpoint.processReporter(mockTrace(now));

    stub(reporter.logger, 'write').callsFake((msg) => {
      console.log(JSON.parse(msg));

      done();
    });
  });
});