import {expect} from 'chai';
import {Patcher} from '../../../src/trace/Patcher';
const fs = require('fs-extra');
const path = require('path');

describe('/test/unit/trace/Patcher.test.ts', () => {

  class CustomPatcher extends Patcher {

    constructor() {
      super();
      this.shimmer();
    }

    getModuleName() {
      return 'pandora-shimmer-test';
    }

    shimmer() {
      let self = this;
      this.hook('^0.0.1', (loadModule) => {
        const target = loadModule('index.js');

        self.getShimmer().wrap(target, ['hello'], function wrapHello() {
          return function wrappedHello() {
            return 'hello, pandora';
          };
        });
        return target;
      });
    }
  }

  before(() => {
    const sourceDir = path.join(__dirname, '../../fixtures/shimmer');
    const targetDir = path.join(__dirname, '../../../node_modules/pandora-shimmer-test');
    fs.removeSync(targetDir);
    fs.copySync(sourceDir, targetDir);
  });

  it('should create new patcher', function () {
    let patcher = new CustomPatcher();
    patcher.run();

    let shimmerTest = require('pandora-shimmer-test');
    expect(shimmerTest.hello()).to.equal('hello, pandora');
  });

});
