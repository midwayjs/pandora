import { expect } from 'chai';
import { DefaultDispatchHandler } from '../../src/hub/DefaultDispatchHandler';

describe('DefaultDispatchHandler', () => {
  it('should echo be ok', async () => {
    const defaultDispatchHandler: DefaultDispatchHandler = new DefaultDispatchHandler();
    const ret = await defaultDispatchHandler.dispatch({
      action: 'echo',
    });
    expect(ret).to.deep.equal({
      echo: { action: 'echo' },
    });
  });

  it('should ignore unknown action be ok', async () => {
    const defaultDispatchHandler: DefaultDispatchHandler = new DefaultDispatchHandler();
    const ret = await defaultDispatchHandler.dispatch({
      action: 'unknown',
    });
    expect(ret).to.be.not.ok;
  });
});
