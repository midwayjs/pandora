import {ProcfileReconciler} from '../../src/application/ProcfileReconciler';
import {join} from 'path';
import {expect} from 'chai';
import {tmpdir} from 'os';
import {readFileSync, unlinkSync} from 'fs';

const pathProjectMaster = join(__dirname, '../fixtures/project/master');

describe('ProcfileReconciler', function () {

  describe('resolve', function () {
    it('should resolve procfile path set be ok', () => {
      const reconciler = new ProcfileReconciler({
        appName: 'test',
        appDir: pathProjectMaster
      });
      expect(reconciler.resovle()).to.be.deep.include(join(pathProjectMaster, 'procfile.js'));
    });
  });

  describe('appInfo', function () {
    it('should get appName be ok', () => {
      const reconciler = new ProcfileReconciler({
        appName: 'test',
        appDir: '-'
      });
      reconciler.callProcfile((pandora => {
        expect(pandora.appName).to.equal('test');
      }));
    });
    it('should get appDir be ok', () => {
      const reconciler = new ProcfileReconciler({
        appName: 'test',
        appDir: 'testdir'
      });
      reconciler.callProcfile((pandora => {
        expect(pandora.appDir).to.equal('testdir');
      }));
    });
  });


  describe('new standard ( process )', function () {


    it('should be ok without fork()', async () => {
      const reconciler = new ProcfileReconciler({
        appName: 'test',
        appDir: '-'
      });
      reconciler.callProcfile((pandora) => {
        pandora.process('a').entry('abc');
        pandora.process('b').entry('abc');
      });
      const appStruc = reconciler.getApplicationStructure();
      expect(appStruc.process.length).to.be.eq(2);
    });

    it('should be ok with fork()', async () => {
      const reconciler = new ProcfileReconciler({
        appName: 'test',
        appDir: '-'
      });
      reconciler.callProcfile((pandora) => {
        pandora.process('a').entry('abc');
        pandora.process('b').entry('abc');
        pandora.fork('c', './true');
      });
      const appStruc = reconciler.getApplicationStructure();
      expect(appStruc.process.length).to.be.eq(3);
    });

    it('should dropProcess() be ok', async () => {
      const reconciler = new ProcfileReconciler({
        appName: 'test',
        appDir: '-'
      });
      reconciler.callProcfile((pandora) => {
        pandora.process('a');
      });
      expect(reconciler.getProcessByName('a')).to.be.ok;
      reconciler.callProcfile((pandora) => {
        pandora.process('a').drop();
      });
      expect(reconciler.getProcessByName('a')).to.be.not.ok;
    });

  });

  describe('structure', function () {

    it('should echoStructure() be ok', () => {

      const tmpFile = join(tmpdir(), 'ProcfileReconciler.test.' + Date.now());
      ProcfileReconciler.echoStructure({
        appName: 'test',
        appDir: pathProjectMaster
      }, tmpFile);
      const content = readFileSync(tmpFile).toString();
      unlinkSync(tmpFile);
      const rp = JSON.parse(content);
      expect(rp).to.be.ok;

    });

    it('should getComplexViaNewProcess() be ok', async () => {

      const ar = {
        appName: 'test',
        appDir: pathProjectMaster
      };

      const structureRepresentation = await ProcfileReconciler.getStructureViaNewProcess(ar);
      const reconcile = new ProcfileReconciler(ar);
      reconcile.discover();
      const structureRepresentation2 = reconcile.getApplicationStructure();
      expect(structureRepresentation).to.deep.equal(structureRepresentation2);
      expect(structureRepresentation.process.length).to.be.gte(1);

    });

  });

});

