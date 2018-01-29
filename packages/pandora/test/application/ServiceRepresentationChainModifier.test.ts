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
    expect(modifier.name('baba')).to.equal(modifier);
    expect(representation.serviceName).to.equal('baba');
    expect(modifier.name()).to.equal(representation.serviceName);
  });

  it('should modify category be ok', () => {
    expect(modifier.process('worker')).to.equal(modifier);
    expect(representation.category).to.equal('worker');
    expect(modifier.process()).to.equal(representation.category);
  });

  it('should modify config be ok when given a object', () => {
    const config = {
      a: 1
    };
    expect(modifier.config(config)).to.equal(modifier);
    expect(representation.config).to.equal(config);
    expect(modifier.config()).to.equal(representation.config);
  });

  it('should modify config be ok when given a function', () => {
    const config = function () {
    };
    expect(modifier.config(config)).to.equal(modifier);
    expect(representation.configResolver).to.equal(config);
  });

  it('should modify dependencies be ok when given a name', () => {
    expect(modifier.dependency('a')).to.equal(modifier);
    expect(representation.dependencies).to.include.members(['a']);
    expect(modifier.dependency()).to.equal(representation.dependencies);
  });

  it('should modify dependencies be ok when given a array', () => {
    expect(modifier.dependency(['b', 'c'])).to.equal(modifier);
    expect(representation.dependencies).to.include.members(['b', 'c']);
  });

  it('should publish be ok', () => {
    expect(modifier.publish()).to.equal(modifier);
    expect(representation.publishToHub).to.equal(true);
    expect(modifier.publish(false)).to.equal(modifier);
    expect(representation.publishToHub).to.equal(false);
  });

  it('should drop be ok', () => {
    let calledDrop = false;
    mm(modifier, 'procfileReconciler', {
      dropServiceByName: (name) => {
        calledDrop = true;
        expect(name).to.equal(representation.serviceName);
      }
    });
    modifier.drop();
    expect(calledDrop).to.equal(true);
    mm.restore();
  });

});
