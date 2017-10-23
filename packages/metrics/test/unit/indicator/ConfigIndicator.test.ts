import {expect} from 'chai';
import {ConfigIndicator} from '../../../src/indicator/impl/ConfigIndicator';
import {Configurator} from 'pandora';
import {IndicatorBuilder} from '../../../src/indicator/IndicatorBuilder';

class MyConfigurator implements Configurator {
  getAllProperties() {
    return Promise.resolve({
      a: 1
    });
  }
}

describe('/test/unit/indicator/Config.test.ts', () => {

  let myConfigurator = new MyConfigurator();
  let indicator = new ConfigIndicator(myConfigurator);
  let builder = new IndicatorBuilder();

  it('instance of correct', () => {
    expect(indicator).to.be.instanceOf(ConfigIndicator);
  });

  it('report Error indicator correct', async () => {
    indicator.initialize();
    await indicator.invoke(null, builder);
    let results = builder.getDetails();

    expect(results.length >= 1).to.be.ok;
    expect(results[0]['data']['a']).to.be.equal(1);
  });

});
