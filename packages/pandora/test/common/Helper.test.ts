import {expect} from 'chai';
import Helpers = require('../../src/common/Helpers');
import mm = require('mm');
import {join, resolve} from 'path';

describe('Helpers', function () {
  it('should calcAppName() by dirname be ok', () => {
    mm(process, 'cwd', function () {
      return __dirname;
    });
    const name = Helpers.calcAppName(__dirname);
    expect(name).to.equal('common');
    mm.restore();
  });
  it('should calcAppName() by package.json be ok', () => {
    const name = Helpers.calcAppName(join(__dirname, '../../'));
    expect(name).to.equal('pandora');
    mm.restore();
  });

  it('should removePkgNameScope() be ok', () => {

    const name1 = Helpers.removePkgNameScope('@ali/abc');
    expect(name1).to.equal('abc');

    const name2 = Helpers.removePkgNameScope('cbd');
    expect(name2).to.equal('cbd');

    const name3 = Helpers.removePkgNameScope('/123');
    expect(name3).to.equal('/123');

  });


  it('test merge config with default mode and outside property', () => {
    mm(process, 'cwd', function () {
      return join(__dirname, '../fixtures/universal/test-fork');
    });

    // pandora start --name test
    expect(() => {
      Helpers.cliParamsToApplicationRepresentation('start', {
        appName: 'test',
        targetPath: __filename
      });
    }).to.throw('Pandora.js can only start a Pandora.js project directory');

    mm.restore();
  });

  it('test merge config with entry', () => {
    mm(process, 'cwd', function () {
      return join(__dirname, '../fixtures/universal/test-fork-1');
    });

    // pandora start --name test
    const forkEntryConfig = Helpers.cliParamsToApplicationRepresentation('start', {
      targetPath: '../../',
    });
    expect(forkEntryConfig.appDir).to.equal(resolve('../../'));
    expect(forkEntryConfig.targetPath).to.equal(undefined);

    mm.restore();
  });
});
