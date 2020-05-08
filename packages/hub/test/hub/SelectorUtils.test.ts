import { expect } from 'chai';
import { SelectorUtils } from '../../src/hub/SelectorUtils';

describe('SelectorUtils', () => {
  it('should fuzzy match be ok', () => {
    expect(
      SelectorUtils.match(
        {
          processName: 'worker',
        },
        {
          processName: 'worker',
          appName: 'appx',
        }
      )
    ).to.be.ok;

    expect(
      SelectorUtils.match(
        {
          appName: 'yep',
        },
        {
          processName: 'worker',
          appName: 'appx',
        }
      )
    ).to.be.not.ok;
  });

  it('should full match be ok', () => {
    expect(
      SelectorUtils.match(
        {
          processName: 'worker',
          appName: 'appx',
        },
        {
          processName: 'worker',
          appName: 'appx',
        }
      )
    ).to.be.ok;

    expect(
      SelectorUtils.match(
        {
          processName: 'worker',
          appName: 'yep',
        },
        {
          processName: 'worker',
          appName: 'appx',
        }
      )
    ).to.be.not.ok;
  });
});
