import {ProcfileReconcilerAccessor} from '../../src/application/ProcfileReconcilerAccessor';
import {expect} from 'chai';

describe('ProcfileReconcilerAccessor', () => {

  it('should get dev be ok', () => {
    process.env.PANDORA_DEV = 'true';
    const pra = new ProcfileReconcilerAccessor(null);
    expect(pra.dev).to.equal(true);
    delete process.env.PANDORA_DEV;
  });

  it('should get appName be ok', () => {
    const pra = new ProcfileReconcilerAccessor(<any> {
      appRepresentation: {
        appName: 'testName'
      }
    });
    expect(pra.appName).to.equal('testName');
  });

  it('should get appDir be ok', () => {
    const pra = new ProcfileReconcilerAccessor(<any> {
      appRepresentation: {
        appDir: 'testDir'
      }
    });
    expect(pra.appDir).to.equal('testDir');
  });


  it('should process() be ok', () => {

    let defineCount;
    let getCount;

    const pra = new ProcfileReconcilerAccessor(<any> {
      getProcessByName(name) {
        getCount++;
        if(name === 'exist') {
          return true;
        }
      },
      defineProcess() {
        defineCount++;
      }
    });

    defineCount = 0;
    getCount = 0;

    pra.process('a');
    pra.process('b');
    pra.process('exist');
    pra.process('c');

    expect(defineCount).to.equal(3);
    expect(getCount).to.equal(4);

  });

  it('should fork() be ok', () => {

    let defineCount;

    const pra = new ProcfileReconcilerAccessor(<any> {
      defineProcess() {
        defineCount++;
      }
    });

    defineCount = 0;

    pra.fork('a', './app');
    pra.fork('b', './app');
    pra.fork('exist', 'test');
    pra.fork('c', './app');

    expect(defineCount).to.equal(4);

  });


  it('should cluster() be ok', () => {

    let calledDefine = 0;
    const pra = new ProcfileReconcilerAccessor(<any> {
      procfileBasePath: './',
      defineProcess() {
        calledDefine++;
      }
    });
    pra.cluster('./app.js');
    pra.cluster('./app2.js');
    expect(calledDefine).to.equal(2);

  });

});
