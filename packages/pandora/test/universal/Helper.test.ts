import {expect} from 'chai';
import Helpers = require('../../src/universal/Helpers');
import mm = require('mm');
import {join, resolve} from 'path';

describe('Helpers', function () {
  it('should calcAppName() by dirname be ok', () => {
    mm(process, 'cwd', function () {
      return __dirname;
    });
    const name = Helpers.calcAppName(__dirname);
    expect(name).to.equal('universal');
    mm.restore();
  });
  it('should calcAppName() by package.json be ok', () => {
    mm(process, 'cwd', function () {
      return join(__dirname, '../../');
    });
    const name = Helpers.calcAppName(__dirname);
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
      Helpers.attachEntryParams('start', {
        appName: 'test',
      }, {
        appName: Helpers.calcAppName(process.cwd())
      });
    }).to.throw('Pandora.js can only start a Pandora.js project directory');

    mm.restore();
  });

  it('test merge config with entry', () => {
    mm(process, 'cwd', function () {
      return join(__dirname, '../fixtures/universal/test-fork-1');
    });

    // pandora start --name test
    const forkEntryConfig = Helpers.attachEntryParams('start', {
      entry: '../../',
    }, {
    });
    expect(forkEntryConfig.appDir).to.equal(resolve('../../'));
    expect(forkEntryConfig.entryFile).to.equal(undefined);

    mm.restore();
  });
});
