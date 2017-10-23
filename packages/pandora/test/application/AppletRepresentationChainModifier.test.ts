import {expect} from 'chai';
import {AppletRepresentation} from '../../src/domain';
import {AppletRepresentationChainModifier} from '../../src/application/AppletRepresentationChainModifier';

describe('AppletRepresentationChainModifier', function () {
  const representation: AppletRepresentation = {
    appletEntry: null,
    appletName: null
  };
  const modifier = new AppletRepresentationChainModifier(representation);

  it('should modify name be ok', () => {
    expect(modifier.name('baba')).to.be.equal(modifier);
    expect(representation.appletName).to.be.equal('baba');
  });

  it('should modify category be ok', () => {
    expect(modifier.category('worker')).to.be.equal(modifier);
    expect(representation.category).to.be.equal('worker');
  });

  it('should modify config be ok when given a object', () => {
    const config = {
      a: 1
    };
    expect(modifier.config(config)).to.be.equal(modifier);
    expect(representation.config).to.be.equal(config);
  });

  it('should modify config be ok when given a function', () => {
    const config = function () {
    };
    expect(modifier.config(config)).to.be.equal(modifier);
    expect(representation.configResolver).to.be.equal(config);
  });

});
