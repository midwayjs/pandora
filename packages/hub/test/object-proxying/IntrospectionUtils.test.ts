import {expect} from 'chai';
import {IntrospectionUtils} from '../../src/object-proxying/IntrospectionUtils';
import {Introspection} from '../../src/domain';

describe('IntrospectionUtils', () => {

  it('should introspect object literal be ok', () => {
    const introspection: Introspection = IntrospectionUtils.introspect({
      a: 1,
      b: 'test',
      c: function () {
      }
    });
    expect(introspection).to.deep.equal(
      {
        properties: [{name: 'a', type: 'number'}, {name: 'b', type: 'string'}],
        methods: [{name: 'c', length: 0, type: 'function'}]
      }
    );
  });

  it('should introspect class constructed object be ok', () => {
    class Test {
      a = 1;
      b = 'test';
      c() {
      }
    }
    const introspection: Introspection = IntrospectionUtils.introspect(new Test());
    expect(introspection).to.deep.equal(
      {
        properties: [
          {name: 'a', type: 'number'},
          {name: 'b', type: 'string'}
        ],
        methods: [
          {name: 'c', length: 0, type: 'function'}
        ]
      }
    );
  });

  it('should introspect class constructed and multilevel inherited object be ok', () => {

    class L1 {
      a = 1;
      b = 'test';
      c() {
      }
    }
    class L2 extends L1 {
      d = 1;
      e = 'test';
      f() {
      }
    }
    class L3 extends L2 {
      g = 1;
      h = 'test';
      i() {
      }
    }

    const introspection: Introspection = IntrospectionUtils.introspect(new L3());
    expect(introspection).to.deep.equal(
      {
        properties: [
          {name: 'a', type: 'number'},
          {name: 'b', type: 'string'},
          {name: 'd', type: 'number'},
          {name: 'e', type: 'string'},
          {name: 'g', type: 'number'},
          {name: 'h', type: 'string'}
        ],
        methods: [
          {name: 'i', length: 0, type: 'function'},
          {name: 'f', length: 0, type: 'function'},
          {name: 'c', length: 0, type: 'function'}
        ]
      }
    );

  });

  it('should identify generator function be ok', () => {

    function * fx() {
    }

    const introspection: Introspection = IntrospectionUtils.introspect({
      normalFn () {
      },
      * generatorFn () {
      },
      fx: fx
    });
    expect(introspection).to.deep.equal(
      {
        properties: [],
        methods: [
          { name: 'normalFn', length: 0, type: 'function' },
          { name: 'generatorFn', length: 0, type: 'generator' },
          { name: 'fx', length: 0, type: 'generator' },
        ]
      }
    );

  });

});
