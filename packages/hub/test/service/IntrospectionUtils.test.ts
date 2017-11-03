import {Hub} from '../../src/hub/Hub';
import {IntrospectionUtils} from '../../src/service/IntrospectionUtils';


describe('IntrospectionUtils', () => {

  it('should introspect() be ok', () => {
    const names = IntrospectionUtils.introspect(new Hub);
    console.log(names);
  });

});
