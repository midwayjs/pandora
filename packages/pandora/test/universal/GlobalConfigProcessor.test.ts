import {expect} from 'chai';
import {GlobalConfigProcessor} from '../../src/universal/GlobalConfigProcessor';
import {join} from 'path';

const pathToGlobalConfigExt = join(__dirname, '../fixtrues/universal/globalConfigExt.js');

describe('GlobalConfigProcessor', function () {

  let globalConfigProcessor: GlobalConfigProcessor = GlobalConfigProcessor.getInstance();

  it('should getInstance() be ok', () => {
    expect(globalConfigProcessor.getAllProperties).to.be.ok;
  });

  it('should getAllProperties() be ok', () => {
    globalConfigProcessor.clearProperties();
    const properties = globalConfigProcessor.getAllProperties();
    expect(properties).to.be.ok;
  });

  it('should getAllProperties() extend config from PANDORA_CONFIG be ok', () => {
    globalConfigProcessor.clearProperties();
    process.env.PANDORA_CONFIG = pathToGlobalConfigExt;
    const properties = globalConfigProcessor.getAllProperties();
    expect((<any>properties).testKey).to.be.equal('testValue');
    process.env.PANDORA_CONFIG = null;
  });

  it('should getAllProperties() ignore error when given a wrong PANDORA_CONFIG', () => {
    globalConfigProcessor.clearProperties();
    process.env.PANDORA_CONFIG = pathToGlobalConfigExt + ':/sdf/dsfsdf/dsf';
    const properties = globalConfigProcessor.getAllProperties();
    expect((<any>properties).testKey).to.be.equal('testValue');
    process.env.PANDORA_CONFIG = null;
  });

  it('shoud merge properties after global config initialized', () => {
    globalConfigProcessor.clearProperties();
    const properties = globalConfigProcessor.getAllProperties();
    globalConfigProcessor.mergeProperties({
      'hello': 'world'
    });
    expect((<any>properties).hello).to.be.equal('world');
  });

});
