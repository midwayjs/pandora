import {expect} from 'chai';
import Helpers = require('../../src/universal/Helpers');
import mm = require('mm');
import {join} from 'path';

describe('Helpers', function () {
  it('should calcAppName() by dirname be ok', () => {
    mm(process, 'cwd', function () {
      return __dirname;
    });
    const name = Helpers.calcAppName(__dirname);
    expect(name).to.be.equal('universal');
    mm.restore();
  });
  it('should calcAppName() by package.json be ok', () => {
    mm(process, 'cwd', function () {
      return join(__dirname, '../../');
    });
    const name = Helpers.calcAppName(__dirname);
    expect(name).to.be.equal('pandora');
    mm.restore();
  });
});
