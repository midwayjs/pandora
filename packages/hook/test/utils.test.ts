import { expect } from 'chai';
import * as utils from '../src/utils/Utils';

describe('hook utils test', () => {

  it('extractPath', () => {
    const base = 'https://www.taobao.com';
    const url = `${base}/extractPath/url`;

    expect(utils.extractPath(base)).to.equal('/');
    expect(utils.extractPath(url)).to.equal('/extractPath/url');
  });

  it('hasOwn', () => {
    const obj = {
      a: 1
    };

    obj['prototype'] = {
      b: 2
    };

    expect(utils.hasOwn(obj, 'a')).to.be.true;
    expect(utils.hasOwn(obj, 'b')).to.be.false;
  });

  it('isLocalhost', () => {
    expect(utils.isLocalhost('localhost')).to.be.true;
    expect(utils.isLocalhost('10.0.0.1')).to.be.false;
    expect(utils.isLocalhost('0:0:0:0:0:0:0:1')).to.be.true;
  });

  it('nodeVersion', () => {
    expect(utils.nodeVersion('>=1')).to.be.true;
  });
});