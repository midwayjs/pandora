import 'mocha';
import {ErrorLogIndicator} from '../src/ErrorLogIndicator';
import {ErrorLog} from '../src/domain';
import {RecentWindow} from '../src/RecentWindow';
import {expect} from 'chai';
describe('ErrorLogIndicator', function () {

  it('should list be ok', async () => {
    const recentWindow = new RecentWindow<ErrorLog>({
      poolSize: 50
    });
    for(let idx = 0, len = 50; idx < len; idx++) {
      recentWindow.push({
        timestamp: idx
      });
    }
    const errorLogIndicator = new ErrorLogIndicator(recentWindow);
    const res = await errorLogIndicator.invoke({
      action: 'list'
    });
    expect(res.length).to.be.equal(50);
  });

  it('should list with limit be ok', async () => {
    const recentWindow = new RecentWindow<ErrorLog>({
      poolSize: 50
    });
    for(let idx = 0, len = 50; idx < len; idx++) {
      recentWindow.push({
        timestamp: idx
      });
    }
    const errorLogIndicator = new ErrorLogIndicator(recentWindow);
    const res = await errorLogIndicator.invoke({
      action: 'list',
      limit: 20
    });
    expect(res.length).to.be.equal(20);
  });

  it('should safe when empty call', async () => {
    const recentWindow = new RecentWindow<ErrorLog>({
      poolSize: 50
    });
    const errorLogIndicator = new ErrorLogIndicator(recentWindow);
    await errorLogIndicator.invoke(<any> {
      action: 'papap'
    });
  });

});
