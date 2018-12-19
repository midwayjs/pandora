import {IndicatorBuilder} from '../../../src/indicator/IndicatorBuilder';
import {expect} from 'chai';
import {ProcessIndicator} from '../../../src/indicator/impl/ProcessIndicator';

describe('/test/unit/indicator/ProcessIndicator.test.ts', () => {

  let indicator = new ProcessIndicator();
  let builder = new IndicatorBuilder();

  it('instance of correct', () => {
    expect(indicator).to.be.instanceOf(ProcessIndicator);
  });

  it('get process indicator correct', async() => {
    await indicator.invoke(null, builder);
    let results = builder.getDetails();

    expect(results.length >= 1).to.be.ok;
  });

});
