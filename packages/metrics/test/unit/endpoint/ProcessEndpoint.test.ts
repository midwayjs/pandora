import {expect} from 'chai';
// import * as cp from 'child_process';
// import * as path from 'path';
import {MetricsConstants, ProcessEndPoint, ProcessIndicator} from '../../../src';
// let count = 5;

describe('/test/unit/endpoint/ProcessEndpoint.test.ts', () => {

  it('invoke process endpoint', async () => {
    let endpoint = new ProcessEndPoint();
    endpoint.initialize();
    // let childs = [];

    let indicator = new ProcessIndicator();
    indicator.initialize();

    // while (count--) {
    //   let c = cp.fork(path.join(__dirname, '../../fixtures/process/client.ts'), process.argv, {
    //     // silent: true,
    //     execArgv: process.execArgv.slice(0).concat([
    //       '-r',
    //       'ts-node/register'
    //     ])
    //   });
    //
    //   c.on('message', (data) => {
    //     console.log('message', data);
    //   });
    //
    //   c.on('error', (data) => {
    //     console.log('err', data);
    //   });
    //
    //   c.on('close', () => {
    //     console.log('close');
    //   });
    //
    //   childs.push(c);
    // }

    let results = await new Promise((resolve, reject) => {
      setTimeout(async () => {
        let re = await endpoint.invoke({
          appName: MetricsConstants.METRICS_DEFAULT_APP
        });
        resolve(<Array<any>>re);
      }, 1000);
    });

    // console.log(results);

    // for(let child of childs) {
    //   child.kill('SIGHUP');
    // }
    expect(results[0].data['cpu'] > 0).to.be.true;

  });

});
