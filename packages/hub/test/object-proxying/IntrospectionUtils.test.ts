import {Hub} from '../../src/hub/Hub';
import {IntrospectionUtils} from '../../src/object-proxying/IntrospectionUtils';


describe('IntrospectionUtils', () => {

  it('should introspect() be ok', () => {
    const names = IntrospectionUtils.introspect(new Hub);
    // TODO:
    console.log(names);
  });

});
