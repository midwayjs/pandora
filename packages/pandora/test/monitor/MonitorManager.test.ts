'use strict';
const path = require('path');
const childProcess = require('child_process');
import {SpawnWrapperUtils} from '../../src/application/SpawnWrapperUtils';
import {PANDORA_PROCESS} from '../../src/const';

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
    process.env[PANDORA_PROCESS] = JSON.stringify({
      appName: 'test-app',
      appDir: path.join(__dirname, `../fixtures/monitor`),
      processName: ''
    });
  });

  after(() => {
    delete process.env[PANDORA_PROCESS];
    SpawnWrapperUtils.unwrap();
  });

  it('should load monitorManager ok', (done) => {
    SpawnWrapperUtils.wrap();
    fork(done);
  });

});


