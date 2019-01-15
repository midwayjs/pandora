import {expect} from 'chai';
import {IndicatorManagerProxy} from '../src/IndicatorManagerProxy';

describe('IndicatorManagerProxy', () => {
  it('should overProcessCallHandle() be ok', () => {
    let got = null;
    const proxy = new IndicatorManagerProxy(<any> {
      invokeRaw (indicatorGroup, query) {
        got = [indicatorGroup, query];
      }
    });
    const expected = ['test', {test: 1}];
    proxy.overProcessCallHandle(<string> expected[0], expected[1]);
    expect(got).to.deep.equal(expected);
  });
});
