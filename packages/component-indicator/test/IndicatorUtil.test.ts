import {expect} from 'chai';
import {IndicatorUtil} from '../src/IndicatorUtil';
import {IndicatorScope} from '../src/domain';

describe('IndicatorUtil', () => {
  it('should mergeRawIndicatorResultRows() be ok', () => {
    const list = [
      {
        appName: 'test',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: IndicatorScope.PROCESS
      }
    ];
    // TODO: mergeRawIndicatorResultRows have not completed yet
    expect(IndicatorUtil.mergeRawIndicatorResultRows(list)).to.be.equal(list);
  });
});
