import {expect} from 'chai';
import {EndPoint} from '../../src/endpoint/EndPoint';
import {MetricsConstants} from '../../src/MetricsConstants';
import {IndicatorScope} from '../../src/domain';
import {Indicator} from '../../src/indicator/Indicator';

class MyEndPoint extends EndPoint {
  group = 'my';
}

class MyIndicator extends Indicator {

  group = 'my';

  async invoke(data, builder) {

    await new Promise((resolve) => {
      setTimeout(() => {

        builder.withDetail('my.during', 15)
          .withDetail('my.start', Date.now(), IndicatorScope.SYSTEM)
          .withDetail('my.end', Date.now() + 15)
          .withDetail('my.count', 100);

        resolve();
      }, 200);
    });
  }
}

describe('/test/unit/EndPoint.test.ts', () => {

  let myEndPoint = new MyEndPoint();
  myEndPoint.initialize();

  let myIndicator = new MyIndicator();

  it('instanceof', () => {
    expect(myEndPoint).to.be.an.instanceof(EndPoint);
  });

  it('indicator is empty when init', () => {
    expect(myEndPoint.indicators.length).to.be.equal(0);
  });

  it('indicators property size = 1 after register a indicator', (done) => {
    myIndicator.initialize();
    setTimeout(() => {
      expect(myEndPoint.indicators.length).to.be.equal(1);
      done();
    }, 100);
  });

  it('query custom EndPoint', (done) => {
    myEndPoint.invoke(MetricsConstants.METRICS_DEFAULT_APP).then((results) => {
      expect(results[MetricsConstants.METRICS_DEFAULT_APP][0].key).to.be.equal('my.during');
      expect(results[MetricsConstants.METRICS_DEFAULT_APP][1].key).to.be.equal('my.start');
      expect(results[MetricsConstants.METRICS_DEFAULT_APP][2].key).to.be.equal('my.end');
      expect(results[MetricsConstants.METRICS_DEFAULT_APP][3].key).to.be.equal('my.count');
      done();
    });
  });

});
