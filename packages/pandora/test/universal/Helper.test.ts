import {expect} from 'chai';
import Helpers = require('../../src/universal/Helpers');
import mm = require('mm');
import {join, resolve} from 'path';
import {PANDORA_GLOBAL_CONFIG} from '../../src/const';

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


  it('should attach entry config from outside', () => {
    mm(process, 'cwd', function () {
      return join(__dirname, '../fixtures/universal/test-test2');
    });
    const forkEntryConfig = Helpers.attachEntryParams('start', {
      appName: 'test-app3',
    });
    const devEntryConfig = Helpers.attachEntryParams('dev', {
      appName: 'test-app3',
    });
    expect(forkEntryConfig.mode).to.be.equal('fork');
    expect(devEntryConfig.mode).to.be.equal('cluster');
    expect(forkEntryConfig.entryFile).to.be.equal('./bin/server.js');
    expect(forkEntryConfig.appName).to.be.equal('test-app3');
    expect(process.env[PANDORA_GLOBAL_CONFIG]).to.be.equal('pandora-taobao:pandora-ali');

    mm.restore();
  });

  it('test merge config with default mode and outside property', () => {
    mm(process, 'cwd', function () {
      return join(__dirname, '../fixtures/universal/test-fork');
    });

    // pandora start --name test
    const forkEntryConfig = Helpers.attachEntryParams('start', {
      appName: 'test',
    }, {
      mode: 'procfile.js',
      appName: Helpers.calcAppName(process.cwd())
    });
    expect(forkEntryConfig.mode).to.be.equal('procfile.js');
    expect(forkEntryConfig.appName).to.be.equal('test');
    expect(forkEntryConfig.appDir).to.be.equal(process.cwd());
    expect(forkEntryConfig.entryFile).to.be.equal(resolve('./bin/server.js'));

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
      mode: 'procfile.js'
    });
    expect(forkEntryConfig.mode).to.be.equal('fork');
    expect(forkEntryConfig.appDir).to.be.equal(resolve('../../'));
    expect(forkEntryConfig.entryFile).to.be.equal(undefined);

    mm.restore();
  });
});
