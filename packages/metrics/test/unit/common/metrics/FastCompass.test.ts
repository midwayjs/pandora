import { expect } from 'chai';
import { BaseFastCompass } from '../../../../src/common/metrics/FastCompass';
const BigNumber = require('long');
describe('/test/unit/common/metrics/FastCompass.test.ts', () => {

  it('testFastCompass', async () => {

    let fastCompass = new BaseFastCompass(10, 10, 10);
    fastCompass.record(2, 'success');
    fastCompass.record(4, 'error');
    fastCompass.record(3, 'success');

    // verify count
    expect(fastCompass.getMethodCountPerCategory().has('success')).to.ok;
    expect(Array.from(fastCompass.getMethodCountPerCategory(0).get('success').values())[ 0 ].toString()).to.equal('2');
    expect(fastCompass.getMethodCountPerCategory().has('error')).to.ok;
    expect(Array.from(fastCompass.getMethodCountPerCategory(0).get('error').values())[ 0 ].toString()).to.equal('1');


    // verify rt
    expect(fastCompass.getMethodRtPerCategory().has('success')).to.ok;
    expect(Array.from(fastCompass.getMethodRtPerCategory(0).get('success').values())[ 0 ].toString()).to.equal('5');
    expect(fastCompass.getMethodRtPerCategory().has('error')).to.ok;
    expect(Array.from(fastCompass.getMethodRtPerCategory(0).get('error').values())[ 0 ].toString()).to.equal('4');


    // total count
    let totalCount = (Array.from(fastCompass.getMethodCountPerCategory(0).get('success').values())[ 0 ].add(
      Array.from(fastCompass.getMethodCountPerCategory(0).get('error').values())[ 0 ]).toString());
    expect(totalCount).to.equal('3');
    // average rt
    let avgRt = (Array.from(fastCompass.getMethodRtPerCategory(0).get('success').values())[ 0 ].add(
      Array.from(fastCompass.getMethodRtPerCategory(0).get('error').values())[ 0 ])).div(totalCount);
    expect(avgRt.toString()).to.equal('3');
    // verify count and rt
    expect(fastCompass.getCountAndRtPerCategory().has('success')).to.ok;
    expect(Array.from(fastCompass.getCountAndRtPerCategory(0).get('success').values())[ 0 ].toString()).to.equal((new BigNumber(2).shiftLeft(38)).add(5).toString());
    expect(fastCompass.getCountAndRtPerCategory().has('error')).to.ok;
    expect(Array.from(fastCompass.getCountAndRtPerCategory(0).get('error').values())[ 0 ].toString()).to.equal((new BigNumber(1).shiftLeft(38)).add(4).toString());
  });

  it('testBinaryAdd', () => {
    let a1 = new BigNumber(1).shiftLeft(38).add(10);
    let a2 = new BigNumber(1).shiftLeft(38).add(20);
    expect(a1.add(a2).shiftRight(38).toString()).to.equal('2');
    expect(new BigNumber(1).shiftLeft(38).toString()).to.equal('274877906944');
    expect(new BigNumber(-1, -1).toString()).to.equal(new BigNumber(1).sub(2).toString());
  });

  it('testMaxSubCategoryCount', () => {
    let fastCompass = new BaseFastCompass(60, 10, 2);
    fastCompass.record(10, 'success');
    fastCompass.record(20, 'error1');
    fastCompass.record(15, 'error2');

    expect(Array.from(fastCompass.getMethodRtPerCategory().keys()).length).to.equal(2);
  });
});
