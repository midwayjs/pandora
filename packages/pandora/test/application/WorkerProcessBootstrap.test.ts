import {WorkerProcessBootstrap} from '../../src/application/WorkerProcessBootstrap';
import {join} from 'path';
import {expect} from 'chai';
import assert = require('assert');

const pathProjectSimple1 = join(__dirname, '../fixtrues/project/simple_1');

describe('WorkerProcessBootstrap', function () {

  it('should start by procfile.js mode be ok', async () => {
    const workerProcessBootstrap = new WorkerProcessBootstrap(null, {
      mode: 'procfile.js',
      processName: 'background',
      appName: 'test',
      appDir: pathProjectSimple1
    });
    await workerProcessBootstrap.start();
    const config = workerProcessBootstrap.context.getProperties();
    expect(config.fake).equal(true);
    const appletReconciler = workerProcessBootstrap.context.appletReconciler;
    const applet = <any> appletReconciler.getAppletInstance('myVeryOwnApplet');
    assert(applet.passTestCase());
    const applet2 = <any> appletReconciler.getAppletInstance('configApplet');
    assert(applet2.getConfig().simple1 === true);
  });

  it('should start by cluster mode be ok', async () => {
    const workerProcessBootstrap = new WorkerProcessBootstrap(null, {
      mode: 'cluster',
      processName: 'worker',
      appName: 'test',
      appDir: '-',
      entryFile: 'spec_entry_file'
    });
    let did = false;
    const Module = require('module');
    const realRequire = Module.prototype.require;
    Module.prototype.require = function (this: Object, name) {
      if (name === 'spec_entry_file') {
        did = true;
        return {};
      }
      return realRequire.apply(this, arguments);
    };
    await workerProcessBootstrap.start();
    expect(did).to.be.equal(true);
    Module.prototype.require = realRequire;
  });

  it('should start by entry be ok', async () => {
    const workerProcessBootstrap = new WorkerProcessBootstrap('sepc_entry', {
      mode: null,
      processName: 'worker',
      appName: 'test',
      appDir: '-',
      entryFile: 'spec_entry_file'
    });
    let did = false;
    const Module = require('module');
    const realRequire = Module.prototype.require;
    Module.prototype.require = function (this: Object, name) {
      if (name === 'sepc_entry') {
        return function (options, cb) {
          expect(options.appName).to.equal('test');
          expect(options.appDir).to.equal('-');
          did = true;
          cb();
        };
      }
      return realRequire.apply(this, arguments);
    };
    await workerProcessBootstrap.start();
    expect(did).to.be.equal(true);
    Module.prototype.require = realRequire;
  });

});
