import {expect} from 'chai';
import {ServiceRepresentationChainModifier} from '../../src/application/ServiceRepresentationChainModifier';
import {ServiceRepresentation} from '../../src/domain';
import mm = require('mm');

describe('ServiceRepresentationChainModifier', function () {

  const representation: ServiceRepresentation = {
    serviceEntry: null,
    serviceName: null
  };
  const modifier = new ServiceRepresentationChainModifier(representation, null);

  it('should modify name be ok', () => {
    expect(modifier.name('baba')).to.be.equal(modifier);
    expect(representation.serviceName).to.be.equal('baba');
    expect(modifier.name()).to.be.equal(representation.serviceName);
  });

  it('should modify category be ok', () => {
    expect(modifier.process('worker')).to.be.equal(modifier);
    expect(representation.category).to.be.equal('worker');
    expect(modifier.process()).to.be.equal(representation.category);
  });

  it('should modify config be ok when given a object', () => {
    const config = {
      a: 1
    };
    expect(modifier.config(config)).to.be.equal(modifier);
    expect(representation.config).to.be.equal(config);
    expect(modifier.config()).to.be.equal(representation.config);
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
    expect(modifier.dependency()).to.be.equal(representation.dependencies);
  });

  it('should modify dependencies be ok when given a array', () => {
    expect(modifier.dependency(['b', 'c'])).to.be.equal(modifier);
    expect(representation.dependencies).to.be.include.members(['b', 'c']);
  });

  it('should publish be ok', () => {
    expect(modifier.publish()).to.be.equal(modifier);
    expect(representation.publishToHub).to.be.equal(true);
    expect(modifier.publish(false)).to.be.equal(modifier);
    expect(representation.publishToHub).to.be.equal(false);
  });

  it('should drop be ok', () => {
    let calledDrop = false;
    mm(modifier, 'procfileReconciler', {
      dropServiceByName: (name) => {
        calledDrop = true;
        expect(name).to.be.equal(representation.serviceName);
      }
    });
    modifier.drop();
    expect(calledDrop).to.be.equal(true);
    mm.restore();
  });

});
