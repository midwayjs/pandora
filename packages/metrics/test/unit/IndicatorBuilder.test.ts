import {IndicatorBuilder} from '../../src/indicator/IndicatorBuilder';
import {expect} from 'chai';

describe('/test/unit/IndicatorBuilder.test.ts', () => {
  it('create new builder', () => {
    let builder = new IndicatorBuilder();
    expect(builder.getDetails()).to.be.an.instanceof(Array);
    expect(builder.getDetails().length).to.be.equal(0);
  });

  it('set an detail', () => {
    let builder = new IndicatorBuilder();
    builder.withDetail('test', 1);
    expect(builder.getDetails().length).to.be.equal(1);
    expect(builder.getDetails()[0]).to.include.keys('key');
    expect(builder.getDetails()[0]).to.include.keys('data');
  });

});
