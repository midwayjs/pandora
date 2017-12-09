import {expect} from 'chai';
import {ProcessRepresentationChainModifier} from '../../src/application/ProcessRepresentationChainModifier';
import {ProcessRepresentation} from '../../src/domain';
import mm = require('mm');

describe('ProcessRepresentationChainModifier', function () {

  const representation: ProcessRepresentation = {
    appName: 'testApp',
    appDir: 'testDir',
    processName: 'testProcess'
  };
  const modifier = new ProcessRepresentationChainModifier(representation, null);

  it('should modify name be ok', () => {
    expect(modifier.name('baba')).to.be.equal(modifier);
    expect(representation.processName).to.be.equal('baba');
    expect(modifier.name()).to.be.equal(representation.processName);
  });

  it('should modify entry  be ok', () => {
    expect(modifier.entry('somePlace')).to.be.equal(modifier);
    expect(representation.entryFile).to.be.equal('somePlace');
    expect(modifier.entry()).to.be.equal(representation.entryFile);
  });

  it('should modify scale be ok', () => {
    expect(modifier.scale(5)).to.be.equal(modifier);
    expect(representation.scale).to.be.equal(5);
    expect(modifier.scale()).to.be.equal(representation.scale);
  });

  it('should modify env be ok', () => {
    const env = {
      a: 1
    };
    expect(modifier.env(env)).to.be.equal(modifier);
    expect(representation.env).to.be.equal(env);
    expect(modifier.env()).to.be.equal(representation.env);
  });

  it('should modify env be ok', () => {
    const argv = ['--expose-gc'];
    expect(modifier.argv(argv)).to.be.equal(modifier);
    expect(representation.argv).to.be.equal(argv);
    expect(modifier.argv()).to.be.equal(representation.argv);
  });

  it('should modify order be ok', () => {
    expect(modifier.order(10)).to.be.equal(modifier);
    expect(representation.order).to.be.equal(10);
    expect(modifier.order()).to.be.equal(representation.order);
  });

  it('should drop be ok', () => {
    let calledDrop = false;
    mm(modifier, 'procfileReconciler', {
      dropProcessByName: (name) => {
        calledDrop = true;
        expect(name).to.be.equal(representation.processName);
      }
    });
    modifier.drop();
    expect(calledDrop).to.be.equal(true);
    mm.restore();
  });

});
