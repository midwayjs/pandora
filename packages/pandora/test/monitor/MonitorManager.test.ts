'use strict';
const path = require('path');
const childProcess = require('child_process');
import {SpawnWrapperUtils} from '../../src/daemon/SpawnWrapperUtils';
import {PANDORA_APPLICATION} from '../../src/const';

declare const global: {
  shimIpc: any;
} & NodeJS.Global;

const fork = function (done) {
  const filePath = require.resolve(path.join(__dirname, `../fixtures/monitor/app.js`));
  const worker = childProcess.fork(filePath, {
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
    execArgv: [
      '-r', 'ts-node/register',
      '-r', 'nyc-ts-patch'
    ]
  });
  worker.on('exit', () => {
    console.log(1);
    done();
  });

  worker.on('error', (err) => {
    console.log(2);
    done(err);
  });
};

describe('/test/monitor/MonitorManager.test.ts', () => {

  before(async() => {
    SpawnWrapperUtils.unwrap();
    if(global.shimIpc) {
      await global.shimIpc.start();
    }
    process.env[PANDORA_APPLICATION] = JSON.stringify({
      appName: 'test-app',
      appDir: path.join(__dirname, `../fixtures/monitor`),
      processName: ''
    });
  });

  after(() => {
    delete process.env[PANDORA_APPLICATION];
    SpawnWrapperUtils.unwrap();
  });

  it('should load monitorManager ok', (done) => {
    SpawnWrapperUtils.wrap();
    fork(done);
  });

});


