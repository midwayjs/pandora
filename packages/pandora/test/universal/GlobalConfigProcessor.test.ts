import {expect} from 'chai';
import {GlobalConfigProcessor} from '../../src/universal/GlobalConfigProcessor';
import {join} from 'path';
import mm = require('mm');

const pathToGlobalConfigExt = join(__dirname, '../fixtures/universal/globalConfigExt.js');

describe('GlobalConfigProcessor', function () {

  let globalConfigProcessor: GlobalConfigProcessor = GlobalConfigProcessor.getInstance();

  beforeEach(() => {
    globalConfigProcessor.clearProperties();
  });

  it('should getInstance() be ok', () => {
    expect(globalConfigProcessor.getAllProperties).to.be.ok;
  });

  it('should getAllProperties() be ok', () => {
    const properties = globalConfigProcessor.getAllProperties();
    expect(properties).to.be.ok;
  });

  it('should getAllProperties() extend config from PANDORA_CONFIG be ok', () => {
    mm(process.env, 'PANDORA_CONFIG', pathToGlobalConfigExt);
    globalConfigProcessor.flushLoadedConfig();
    const properties = globalConfigProcessor.getAllProperties();
    expect((<any>properties).testKey).to.equal('testValue');
    mm.restore();
  });

  it('should getAllProperties() ignore error when given a wrong PANDORA_CONFIG', () => {
    mm(process.env, 'PANDORA_CONFIG', pathToGlobalConfigExt + ':/sdf/dsfsdf/dsf');
    globalConfigProcessor.flushLoadedConfig();
    const properties = globalConfigProcessor.getAllProperties();
    expect((<any>properties).testKey).to.equal('testValue');
    mm.restore();
  });

  it('shoud merge properties after global config initialized', () => {
    globalConfigProcessor.flushLoadedConfig();
    const properties = globalConfigProcessor.getAllProperties();
    globalConfigProcessor.mergeProperties({
      'hello': 'world'
    });
    expect((<any>properties).hello).to.equal('world');
  });

});
