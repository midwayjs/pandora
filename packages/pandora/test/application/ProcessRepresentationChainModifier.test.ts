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
    expect(modifier.name('baba')).to.equal(modifier);
    expect(representation.processName).to.equal('baba');
    expect(modifier.name()).to.equal(representation.processName);
  });

  it('should modify entry  be ok', () => {
    expect(modifier.entry('somePlace')).to.equal(modifier);
    expect(representation.entryFile).to.equal('somePlace');
    expect(modifier.entry()).to.equal(representation.entryFile);
  });

  it('should modify scale be ok', () => {
    expect(modifier.scale(5)).to.equal(modifier);
    expect(representation.scale).to.equal(5);
    expect(modifier.scale()).to.equal(representation.scale);
  });

  it('should modify env be ok', () => {
    const env = {
      a: 1
    };
    expect(modifier.env(env)).to.equal(modifier);
    expect(representation.env).to.equal(env);
    expect(modifier.env()).to.equal(representation.env);
  });

  it('should modify env be ok', () => {
    const argv = ['--expose-gc'];
    expect(modifier.argv(argv)).to.equal(modifier);
    expect(representation.argv).to.equal(argv);
    expect(modifier.argv()).to.equal(representation.argv);
  });

  it('should modify order be ok', () => {
    expect(modifier.order(10)).to.equal(modifier);
    expect(representation.order).to.equal(10);
    expect(modifier.order()).to.equal(representation.order);
  });

  it('should drop be ok', () => {
    let calledDrop = false;
    mm(modifier, 'procfileReconciler', {
      dropProcessByName: (name) => {
        calledDrop = true;
        expect(name).to.equal(representation.processName);
      }
    });
    modifier.drop();
    expect(calledDrop).to.equal(true);
    mm.restore();
  });

});
