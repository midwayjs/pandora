import {ProcfileReconcilerAccessor} from '../../src/application/ProcfileReconcilerAccessor';
import {expect} from 'chai';

describe('ProcfileReconcilerAccessor', () => {

  it('should get dev be ok', () => {
    process.env.PANDORA_DEV = 'true';
    const pra = new ProcfileReconcilerAccessor(null);
    expect(pra.dev).to.be.equal(true);
    delete process.env.PANDORA_DEV;
  });

  it('should get appName be ok', () => {
    const pra = new ProcfileReconcilerAccessor(<any> {
      appRepresentation: {
        appName: 'testName'
      }
    });
    expect(pra.appName).to.be.equal('testName');
  });

  it('should get appDir be ok', () => {
    const pra = new ProcfileReconcilerAccessor(<any> {
      appRepresentation: {
        appDir: 'testDir'
      }
    });
    expect(pra.appDir).to.be.equal('testDir');
  });

  it('should defaultServiceCategory() be ok', () => {
    let calledSet = false;
    const pra = new ProcfileReconcilerAccessor(<any> {
      getDefaultServiceCategory() {
        return 'def';
      },
      setDefaultServiceCategory(reg) {
        calledSet = true;
        expect(reg).to.be.equal('new');
      }
    });
    expect(pra.defaultServiceCategory()).to.be.equal('def');
    pra.defaultServiceCategory('new');
    expect(calledSet).to.be.equal(true);
  });

  it('should environment() be ok', () => {
    let calledSet = false;
    const pra = new ProcfileReconcilerAccessor(<any> {
      getEnvironment() {
        return 'def';
      },
      injectEnvironment(reg) {
        calledSet = true;
        expect(reg).to.be.equal('new');
      }
    });
    expect(pra.environment()).to.be.equal('def');
    pra.environment('new');
    expect(calledSet).to.be.equal(true);
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

    expect(defineCount).to.be.equal(3);
    expect(getCount).to.be.equal(4);

  });

  it('should fork() be ok', () => {

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

    pra.fork('a', './app');
    pra.fork('b', './app');
    pra.fork('exist');
    pra.fork('c', './app');

    expect(defineCount).to.be.equal(3);
    expect(getCount).to.be.equal(4);

  });

  it('should service() be ok', () => {

    let injectCount;
    let getCount;

    const pra = new ProcfileReconcilerAccessor(<any> {
      getServiceByName(name) {
        getCount++;
        if(name === 'exist') {
          return true;
        }
      },
      injectService() {
        injectCount++;
      }
    });

    injectCount = 0;
    getCount = 0;

    pra.service('a', './s.js');
    pra.service('b', './s.js');
    pra.service('exist');
    expect(() => { pra.service('exist', './s.js'); }).to.throw('Service already exist!');
    pra.service('c', './s.js');

    expect(injectCount).to.be.equal(3);
    expect(getCount).to.be.equal(5);

  });

  it('should cluster() be ok', () => {

    let calledServiceTimes = 0;
    const pra = new ProcfileReconcilerAccessor(<any> {
      procfileBasePath: './'
    });
    (<any> pra).service = (name, entry) => {
      expect(name.startsWith('cluster'));
      expect(entry).to.be.ok;
      calledServiceTimes++;
    };
    pra.cluster('./app.js');
    pra.cluster('./app2.js');
    expect(calledServiceTimes).to.be.equal(2);

  });

});