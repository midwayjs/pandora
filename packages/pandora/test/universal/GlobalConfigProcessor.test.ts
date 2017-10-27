import {expect} from 'chai';
import {GlobalConfigProcessor} from '../../src/universal/GlobalConfigProcessor';
import {join} from 'path';

const pathToGlobalConfigExt = join(__dirname, '../fixtrues/universal/globalConfigExt.js');

describe('GlobalConfigProcessor', function () {

  let globalConfigProcessor: GlobalConfigProcessor;

  it('should getInstance() be ok', () => {
    globalConfigProcessor = GlobalConfigProcessor.getInstance();
    expect(globalConfigProcessor.getAllProperties).to.be.ok;
  });

  it('should getAllProperties() be ok', () => {
    globalConfigProcessor.globalConfig = null;
    const properties = globalConfigProcessor.getAllProperties();
    expect(properties).to.be.ok;
  });

  it('should getAllProperties() extend config from PANDORA_CONFIG be ok', () => {
    globalConfigProcessor.globalConfig = null;
    process.env.PANDORA_CONFIG = pathToGlobalConfigExt;
    const properties = globalConfigProcessor.getAllProperties();
    expect(properties.testKey).to.be.equal('testValue');
    process.env.PANDORA_CONFIG = null;
  });

  it('should getAllProperties() ignore error when given a wrong PANDORA_CONFIG', () => {
    globalConfigProcessor.globalConfig = null;
    process.env.PANDORA_CONFIG = pathToGlobalConfigExt + ':/sdf/dsfsdf/dsf';
    const properties = globalConfigProcessor.getAllProperties();
    expect(properties.testKey).to.be.equal('testValue');
    process.env.PANDORA_CONFIG = null;
  });

});
