import { expect } from 'chai';
import * as sinon from 'sinon';
import { consoleLogger } from 'pandora-dollar';
import * as Shimmer from '../src/Shimmer';

describe('Shimmer', () => {

  const target = {
    async asyncFunc() {
      throw new Error('async');
    },
    * generatorFunc() {
      throw new Error('generator');
    },
    nonFunction: 1,
    unwrap: {
      __unwrap: false
    },
    wrap: () => {
      throw new Error('origin');
    }
  };

  it('should not wrap when module no that method', () => {
    const spy = sinon.spy(consoleLogger, 'info');

    Shimmer.wrap(target, 'unexist', () => {});

    expect(spy.calledWith(sinon.match('no original function')));

    spy.restore();
  });

  it('should not wrap method without wrapper', () => {
    const spy = sinon.spy(consoleLogger, 'info');

    (<any>Shimmer).wrap(target, 'wrap');

    expect(spy.calledWith(sinon.match('no wrapper function')));

    spy.restore();
  });

  it('should not wrap method when it not function', () => {
    const spy = sinon.spy(consoleLogger, 'info');

    Shimmer.wrap(target, 'nonFunction', () => {});

    expect(spy.calledWith(sinon.match('original object and wrapper must be functions')));

    spy.restore();
  });

  it('should not massWrap when no module', () => {
    const spy = sinon.spy(consoleLogger, 'info');

    (<any>Shimmer).massWrap();

    expect(spy.calledWith(sinon.match('must provide one or more modules to patch')));

    spy.restore();
  });

  it('should not massWrap when no names', () => {
    const spy = sinon.spy(consoleLogger, 'info');

    (<any>Shimmer).massWrap(target);

    expect(spy.calledWith(sinon.match('must provide one or more functions to wrap on modules')));

    spy.restore();
  });

  it('should not unwrap when no module', () => {
    const spy = sinon.spy(consoleLogger, 'info');

    (<any>Shimmer).unwrap();

    expect(spy.calledWith(sinon.match('no function to unwrap')));

    spy.restore();
  });

  it('should not unwrap twice', () => {
    const spy = sinon.spy(consoleLogger, 'info');

    (<any>Shimmer).unwrap(target, 'unwrap');

    expect(spy.calledWith(sinon.match('no original to unwrap to -- has')));

    spy.restore();
  });

  it('should not massUnwrap when no nodules', () => {
    const spy = sinon.spy(consoleLogger, 'info');

    (<any>Shimmer).massUnwrap();

    expect(spy.calledWith(sinon.match('must provide one or more modules to patch')));

    spy.restore();
  });

  it('should not massUnwrap when no names', () => {
    const spy = sinon.spy(consoleLogger, 'info');

    (<any>Shimmer).massUnwrap(target);

    expect(spy.calledWith(sinon.match('must provide one or more functions to unwrap on modules')));

    spy.restore();
  });

  it('should massWrap and massUnwrap', () => {
    Shimmer.massWrap(target, ['wrap'], () => {
      return () => {
        throw new Error('wrapped');
      };
    });

    try {
      target.wrap();
    } catch (error) {
      expect(error.message).to.equal('wrapped');
    }

    Shimmer.massUnwrap(target, ['wrap']);

    try {
      target.wrap();
    } catch (error) {
      expect(error.message).to.equal('origin');
    }
  });

  it('should wrap async function', async () => {
    Shimmer.wrap(target, 'asyncFunc', () => {
      return async () => {
        throw new Error('wrapped');
      };
    });

    try {
      await target.asyncFunc();
    } catch (error) {
      expect(error.message).to.equal('wrapped');
    }

    Shimmer.unwrap(target, 'asyncFunc');

    try {
      await target.asyncFunc();
    } catch (error) {
      expect(error.message).to.equal('async');
    }
  });

  it('should wrap generator function', function * () {
    Shimmer.wrap(target, 'generatorFunc', () => {
      return function* () {
        throw new Error('wrapped');
      };
    });

    try {
      yield target.asyncFunc();
    } catch (error) {
      expect(error.message).to.equal('wrapped');
    }

    Shimmer.unwrap(target, 'generatorFunc');

    try {
      yield target.asyncFunc();
    } catch (error) {
      expect(error.message).to.equal('origin');
    }
  });

  it('should detect generator function', () => {
    let res = Shimmer.isGeneratorFunction({
      constructor: false
    });

    expect(res).to.equal(false);

    res = Shimmer.isGeneratorFunction({
      constructor: {
        name: 'GeneratorFunction',
        displayName: 'GeneratorFunction'
      }
    });

    expect(res).to.equal(true);

    res = Shimmer.isGeneratorFunction({
      constructor: {
        prototype: {
          next: function() {},
          throw: function() {}
        }
      }
    });

    expect(res).to.equal(true);
  });
});