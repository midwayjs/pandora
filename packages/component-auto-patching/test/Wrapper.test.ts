import { Wrapper } from '../src/patchers/wrappers/Wrapper';

describe('ComponentAutoPatching -> Wrapper', () => {
  it('should custom wrapper work', () => {
    const wrapper = new Wrapper({}, <any>{}, <any>{}, 'test', {});

    wrapper.wrap('test');
    wrapper.unwrap('test');
  });
});