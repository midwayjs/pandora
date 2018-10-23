import { expect } from 'chai';
import { BaseFastCompass } from '../../../../src/common/metrics/FastCompass';

describe('/test/unit/metrics/common/metrics/FastCompass.test.ts', () => {

  it('testFastCompass', async () => {

    let fastCompass = new BaseFastCompass(10, 10, 10);
    fastCompass.record(2, 'success');
    fastCompass.record(4, 'error');
    fastCompass.record(3, 'success');

    // verify count
    expect(fastCompass.getMethodCountPerCategory().has('success')).to.ok;
    expect(Array.from(fastCompass.getMethodCountPerCategory(0).get('success').values())[ 0 ]).to.equal(2);
    expect(fastCompass.getMethodCountPerCategory().has('error')).to.ok;
    expect(Array.from(fastCompass.getMethodCountPerCategory(0).get('error').values())[ 0 ]).to.equal(1);


    // verify rt
    expect(fastCompass.getMethodRtPerCategory().has('success')).to.ok;
    expect(Array.from(fastCompass.getMethodRtPerCategory(0).get('success').values())[ 0 ]).to.equal(5);
    expect(fastCompass.getMethodRtPerCategory().has('error')).to.ok;
    expect(Array.from(fastCompass.getMethodRtPerCategory(0).get('error').values())[ 0 ]).to.equal(4);


    // total count
    let totalCount = Array.from(fastCompass.getMethodCountPerCategory(0).get('success').values())[ 0 ] +
      Array.from(fastCompass.getMethodCountPerCategory(0).get('error').values())[ 0 ];
    expect(totalCount).to.equal(3);
    // average rt
    let avgRt = (Array.from(fastCompass.getMethodRtPerCategory(0).get('success').values())[ 0 ] +
      Array.from(fastCompass.getMethodRtPerCategory(0).get('error').values())[ 0 ]) / totalCount;
    expect(avgRt).to.equal(3);
    // verify count and rt
    expect(fastCompass.getCountAndRtPerCategory().has('success')).to.ok;
    expect(Array.from(fastCompass.getCountAndRtPerCategory(0).get('success').values())[ 0 ]).to.equal((2 << 38) + 5);
    expect(fastCompass.getCountAndRtPerCategory().has('error')).to.ok;
    expect(Array.from(fastCompass.getCountAndRtPerCategory(0).get('error').values())[ 0 ]).to.equal((1 << 38) + 4);
  });

  it('testBinaryAdd', () => {
    let a1 = (1 << 38) + 10;
    let a2 = (1 << 38) + 20;
    expect((a1 + a2) >> 38).to.equal(2);
  });

  it('testMaxSubCategoryCount', () => {
    let fastCompass = new BaseFastCompass(60, 10, 2);
    fastCompass.record(10, 'success');
    fastCompass.record(20, 'error1');
    fastCompass.record(15, 'error2');

    expect(Array.from(fastCompass.getMethodRtPerCategory().keys()).length).to.equal(2);
  });
});
