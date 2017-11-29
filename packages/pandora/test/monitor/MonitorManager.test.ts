'use strict';
const path = require('path');
const childProcess = require('child_process');
import {SpawnWrapperUtils} from '../../src/daemon/SpawnWrapperUtils';
import {PANDORA_APPLICATION} from '../../src/const';

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
    done();
  });

  worker.on('error', (err) => {
    done(err);
  });
};

describe('/test/monitor/MonitorManager.test.ts', () => {

  before(() => {
    process.env[PANDORA_APPLICATION] = JSON.stringify({
      appName: 'test-app',
      appDir: path.join(__dirname, `../fixtures/monitor`),
      processName: ''
    });
  });

  after(() => {
    delete process.env[PANDORA_APPLICATION];
  });

  it('shoud load monitorManager ok', (done) => {
    SpawnWrapperUtils.wrap();
    fork(done);
  });

});


