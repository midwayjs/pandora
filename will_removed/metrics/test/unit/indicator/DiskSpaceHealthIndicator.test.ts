import {expect} from 'chai';
import {DiskSpaceHealthIndicator} from '../../../src/index';
import {HealthBuilder} from '../../../src/indicator/impl/health/HealthBuilder';

describe('/test/unit/indicator/DiskSpaceHealthIndicator.test.ts', () => {

  it('instance of correct', () => {
    let indicator = new DiskSpaceHealthIndicator();
    expect(indicator).to.be.instanceOf(DiskSpaceHealthIndicator);
  });

  it('get disk space result up', async () => {
    let indicator = new DiskSpaceHealthIndicator();
    let builder = new HealthBuilder('disk_space');
    indicator.initialize();
    await indicator.invoke(null, builder);
    let results = builder.getDetails();
    expect(results.length >= 1).to.be.ok;
  });

});
