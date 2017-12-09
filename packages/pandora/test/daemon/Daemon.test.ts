import mm = require('mm');
import {expect} from 'chai';
import urllib = require('urllib');
import {Daemon} from '../../src/daemon/Daemon';
import {join} from 'path';
import {DefaultEnvironment, EnvironmentUtil} from 'pandora-env';
import {MetricsConstants} from 'pandora-metrics';
import {State} from '../../src/const';

const pathProjectMaster = join(__dirname, '../fixtures/project/master');


describe('Daemon', function () {

  describe('method', function () {

    let daemon: Daemon = null;
    let beforeCurEnv = null;

    before(() => {
      daemon = new Daemon();
      const daemonEnvironment = new DefaultEnvironment({
        processName: 'daemon',
        appName: MetricsConstants.METRICS_DEFAULT_APP
      });
      beforeCurEnv = EnvironmentUtil.getInstance().getCurrentEnvironment();
      EnvironmentUtil.getInstance().setCurrentEnvironment(daemonEnvironment);
    });

    after(async () => {
      await daemon.stop();
      EnvironmentUtil.getInstance().setCurrentEnvironment(beforeCurEnv);
    });

    it('should start daemon be ok', async () => {
      await daemon.start();
    });

    it('should startApp() be ok', async () => {
      const applicationHandler = await daemon.startApp({
        appName: 'test',
        appDir: pathProjectMaster
      });
      expect(applicationHandler.state).equal(State.complete);
      expect(applicationHandler.appId).to.be.ok;
      expect(applicationHandler.appName).equal('test');
      const ret = await urllib.request('http://127.0.0.1:1338/');
      expect(ret.res.data.toString()).equal('okay');
    });

    it('should reloadApp() be ok', async () => {
      await daemon.reloadApp('test');
      const ret = await urllib.request('http://127.0.0.1:1338/');
      expect(ret.res.data.toString()).equal('okay');
    });

    it('should stopApp() be ok', async () => {
      const applicationHandler = await daemon.stopApp('test');
      expect(applicationHandler.state).equal(State.stopped);
    });

    it('should startApp() error if appDir does not exists', async function () {
      const appDir = '/tj';
      try {
        await daemon.startApp({
          appDir,
          appName: 'demo',
        });
      } catch (err) {
        expect(err.name).to.be.includes('AssertionError');
        expect(err.message).equal(`${appDir} does not exists!`);
      }
    });

  });

  describe('command', function () {

    let daemon: Daemon;
    let beforeCurEnv = null;

    before(async () => {
      daemon = new Daemon();
      const daemonEnvironment = new DefaultEnvironment({
        processName: 'daemon',
        appName: MetricsConstants.METRICS_DEFAULT_APP
      });
      beforeCurEnv = EnvironmentUtil.getInstance().getCurrentEnvironment();
      EnvironmentUtil.getInstance().setCurrentEnvironment(daemonEnvironment);
      await daemon.start();
    });

    after(async () => {
      try {
        await daemon.stop();
      } catch (error) {
        // Ignore stop error, be course of command 'exit' has already exited Daemon
        // Stop again just in case
      }
      EnvironmentUtil.getInstance().setCurrentEnvironment(beforeCurEnv);
    });

    it('should handle command start be ok', async () => {
      await new Promise((resolve, reject) => {
        daemon.handleCommand({
          command: 'start',
          args: {
            appName: 'test',
            appDir: pathProjectMaster
          }
        }, (res) => {
          if (res.error) {
            reject(res.error);
            return;
          }
          resolve(res.data);
        });
      });
      const ret = await urllib.request('http://127.0.0.1:1338/');
      expect(ret.res.data.toString()).equal('okay');
    });

    it('should handle command list be ok', async () => {
      const data: any = await new Promise((resolve, reject) => {
        daemon.handleCommand({
          command: 'list',
          args: {}
        }, (res) => {
          if (res.error) {
            reject(res.error);
            return;
          }
          resolve(res.data);
        });
      });
      expect(data.length).to.be.gt(0);
    });

    it('should handle command restart be ok', async () => {
      await new Promise((resolve, reject) => {
        daemon.handleCommand({
          command: 'restart',
          args: {
            appName: 'test'
          }
        }, (res) => {
          if (res.error) {
            reject(res.error);
            return;
          }
          resolve(res.data);
        });
      });
      const ret = await urllib.request('http://127.0.0.1:1338/');
      expect(ret.res.data.toString()).equal('okay');
    });

    it('should handle command stopApp be ok', async () => {
      await new Promise((resolve, reject) => {
        daemon.handleCommand({
          command: 'stopApp',
          args: {
            appName: 'test'
          }
        }, (res) => {
          if (res.error) {
            reject(res.error);
            return;
          }
          resolve(res.data);
        });
      });
      try {
        await urllib.request('http://127.0.0.1:1338/');
      } catch (err) {
        return;
      }
      throw new Error();
    });

    it('should handle command stopAll be ok', async () => {
      await new Promise((resolve, reject) => {
        daemon.handleCommand({
          command: 'stopAll',
          args: {
            appName: 'test'
          }
        }, (res) => {
          if (res.error) {
            reject(res.error);
            return;
          }
          resolve(res.data);
        });
      });
    });

    it('should handle command exit be ok', async () => {
      let did = false;
      await new Promise((resolve, reject) => {
        mm(process, 'exit', function (code) {
          if (0 === code && !did) {
            resolve();
            did = true;
          }
        });
        daemon.handleCommand({
          command: 'exit',
          args: {
            appName: 'test'
          }
        }, (res) => {
          if (res.error) {
            reject(res.error);
            return;
          }
          resolve(res.data);
        });
      });
      mm.restore();
    });

  });

});
