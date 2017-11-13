import {expect} from 'chai';
import {ServiceRepresentationChainModifier} from '../../src/application/ServiceRepresentationChainModifier';
import {ServiceRepresentation} from '../../src/domain';

describe('ServiceRepresentationChainModifier', function () {

  const representation: ServiceRepresentation = {
    serviceEntry: null,
    serviceName: null
  };
  const modifier = new ServiceRepresentationChainModifier(representation);

  it('should modify name be ok', () => {
    expect(modifier.name('baba')).to.be.equal(modifier);
    expect(representation.serviceName).to.be.equal('baba');
  });

  it('should modify category be ok', () => {
    expect(modifier.process('worker')).to.be.equal(modifier);
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

  it('should modify dependencies be ok when given a name', () => {
    expect(modifier.dependency('a')).to.be.equal(modifier);
    expect(representation.dependencies).to.be.include.members(['a']);
  });

  it('should modify dependencies be ok when given a array', () => {
    expect(modifier.dependency(['b', 'c'])).to.be.equal(modifier);
    expect(representation.dependencies).to.be.include.members(['b', 'c']);
  });

});
