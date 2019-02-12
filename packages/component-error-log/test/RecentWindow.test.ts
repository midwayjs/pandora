import 'mocha';
import {RecentWindow} from '../src/RecentWindow';
import {expect} from 'chai';

describe('RecentWindow', function () {

  it('should record and list be ok', () => {
    const recentWindow = new RecentWindow<number>({
      poolSize: 10
    });
    recentWindow.push(1);
    recentWindow.push(2);
    recentWindow.push(3);
    expect(recentWindow.list()).to.deep.equal([1, 2, 3]);
  });

  it('should record and list be ok when over push', () => {
    const recentWindow = new RecentWindow<number>({
      poolSize: 5
    });
    recentWindow.push(1);
    recentWindow.push(2);
    recentWindow.push(3);
    recentWindow.push(4);
    recentWindow.push(5);
    recentWindow.push(6);
    recentWindow.push(7);
    recentWindow.push(8);
    expect(recentWindow.list()).to.deep.equal([4, 5, 6, 7, 8]);
  });

});
