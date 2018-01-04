import {EWMA} from '../../../../src/common/util/EWMA';
import {expect} from 'chai';

function elapseMinute(ewma) {
  for (let i = 1; i <= 12; i++) {
    ewma.tick();
  }
}

describe('/test/unit/common/util/EWMA.test.ts', () => {
  it('should aOneMinuteEWMAWithAValueOfThree', function () {
    let ewma = EWMA.oneMinuteEWMA();
    ewma.update(3);
    ewma.tick();

    expect(ewma.getRate()).to.equal(0.6);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).to.equal(0.22072766);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).to.equal(0.08120117);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).to.equal(0.02987224);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).to.equal(0.01098938);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).to.equal(0.00404277);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).to.equal(0.00148725);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).to.equal(0.00054713);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).to.equal(0.00020128);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).to.equal(0.00007405);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).to.equal(0.00002724);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).to.equal(0.00001002);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).to.equal(0.00000369);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).to.equal(0.00000136);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).to.equal(0.00000050);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).to.equal(0.00000018);
  });

  it('should aFiveMinuteEWMAWithAValueOfThree', function () {
    let ewma = EWMA.fiveMinuteEWMA();
    ewma.update(3);
    ewma.tick();

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.6);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.49123845);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.40219203);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.32928698);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.26959738);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.22072766);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.18071653);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.14795818);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.12113791);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.09917933);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.08120117);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.06648190);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.05443077);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.04456415);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.03648604);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.02987224);
  });

  it('should aFifteenMinuteEWMAWithAValueOfThree', function () {
    let ewma = EWMA.fifteenMinuteEWMA();
    ewma.update(3);
    ewma.tick();

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.6);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.56130419);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.52510399);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.49123845);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.45955700);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.42991879);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.40219203);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.37625345);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.35198773);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.32928698);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.30805027);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.28818318);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.26959738);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.25221023);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.23594443);

    elapseMinute(ewma);

    expect(parseFloat(ewma.getRate().toFixed(8))).equal(0.22072766);
  });
});
