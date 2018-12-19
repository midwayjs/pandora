import {Gauge} from '../../../src/client/MetricsProxy';
import {expect} from 'chai';

describe('/test/unit/client/MetricsProxy.test.ts', () => {
  it('create BaseGauge interface Proxy', () => {

    let gauge = <Gauge<number>> {
      getValue() {
        return 100;
      }
    };

    expect(gauge instanceof Gauge).to.false;
    expect(gauge.getValue()).to.equal(100);

  });

  it('create BaseGauge use extends', () => {
    class CpuGauge extends Gauge<number> {
      getValue(): number {
        return 10;
      }
    }

    let gauge = new CpuGauge();

    expect(gauge instanceof Gauge).to.true;
    expect(gauge instanceof CpuGauge).to.true;
    expect(gauge.getValue()).to.equal(10);

  });
});
