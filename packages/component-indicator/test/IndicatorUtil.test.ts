import { expect } from 'chai';
import { IndicatorUtil } from '../src/IndicatorUtil';
import { IndicatorScope } from '../src/types';

describe('IndicatorUtil', () => {
  it('should mergeRawIndicatorResultRows() with PROCESS scope be ok', () => {
    const list = [
      {
        appName: 'test',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: IndicatorScope.PROCESS,
      },
      {
        appName: 'test',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: IndicatorScope.PROCESS,
      },
    ];
    expect(IndicatorUtil.mergeRawIndicatorResultRows(list)).to.deep.equal(list);
  });

  it('should mergeRawIndicatorResultRows() with APP scope be ok', () => {
    const list = [
      {
        appName: 'test',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: IndicatorScope.APP,
      },
      {
        appName: 'test',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: IndicatorScope.APP,
      },
      {
        appName: 'test1',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: IndicatorScope.APP,
      },
      {
        appName: 'test1',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: IndicatorScope.APP,
      },
    ];
    expect(IndicatorUtil.mergeRawIndicatorResultRows(list)).to.deep.equal([
      list[0],
      list[2],
    ]);
  });

  it('should mergeRawIndicatorResultRows() with SYSTEM scope be ok', () => {
    const list = [
      {
        appName: 'test',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: IndicatorScope.SYSTEM,
      },
      {
        appName: 'test',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: IndicatorScope.SYSTEM,
      },
      {
        appName: 'test1',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: IndicatorScope.SYSTEM,
      },
      {
        appName: 'test1',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: IndicatorScope.SYSTEM,
      },
    ];
    expect(IndicatorUtil.mergeRawIndicatorResultRows(list)).to.deep.equal([
      list[0],
    ]);
  });

  it('should mergeRawIndicatorResultRows() with mess scopes be ok', () => {
    const list = [
      {
        appName: 'test',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: IndicatorScope.SYSTEM,
      },
      {
        appName: 'test',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: IndicatorScope.SYSTEM,
      },
      {
        appName: 'test1',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: IndicatorScope.SYSTEM,
      },
      {
        appName: 'test1',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: IndicatorScope.SYSTEM,
      },
      {
        appName: 'test',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: IndicatorScope.APP,
      },
      {
        appName: 'test',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: IndicatorScope.APP,
      },
      {
        appName: 'test1',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: IndicatorScope.APP,
      },
      {
        appName: 'test1',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: IndicatorScope.APP,
      },
      {
        appName: 'test',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: IndicatorScope.PROCESS,
      },
      {
        appName: 'test',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: IndicatorScope.PROCESS,
      },
    ];
    expect(IndicatorUtil.mergeRawIndicatorResultRows(list)).to.deep.equal([
      {
        appName: 'test',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: 'SYSTEM',
      },
      {
        appName: 'test',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: 'APP',
      },
      {
        appName: 'test1',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: 'APP',
      },
      {
        appName: 'test',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: 'PROCESS',
      },
      {
        appName: 'test',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: 'PROCESS',
      },
    ]);
  });

  it('should have default behavior when mergeRawIndicatorResultRows() got a unknown scope type', () => {
    const list = [
      {
        appName: 'test',
        pid: '1234',
        group: '1234',
        key: '1234',
        data: {},
        scope: 'xxx',
      },
    ];

    expect(
      IndicatorUtil.mergeRawIndicatorResultRows(list as any)
    ).to.deep.equal(list);
  });
});
