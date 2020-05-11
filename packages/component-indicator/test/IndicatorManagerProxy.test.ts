import { expect } from 'chai';
import { IndicatorManagerProxy } from '../src/IndicatorManagerProxy';

describe('IndicatorManagerProxy', () => {
  it('should overProcessCallHandle() be ok', () => {
    let got = null;
    const proxy = new IndicatorManagerProxy({
      invokeRaw(indicatorGroup, query) {
        got = [indicatorGroup, query];
      },
    } as any);
    const expected = ['test', { test: 1 }];
    proxy.overProcessCallHandle(expected[0] as string, expected[1]);
    expect(got).to.deep.equal(expected);
  });
});
