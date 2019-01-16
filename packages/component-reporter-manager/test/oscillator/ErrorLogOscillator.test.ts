import {ErrorLogManager} from 'pandora-component-error-log';
import {ErrorLogOscillator} from '../../src/oscillator/ErrorLogOscillator';
import {expect} from 'chai';
import {EventEmitter} from 'events';

describe('ErrorLogOscillator', () => {

  it('should proxy dump event of errorLogManager to event oscillate of ErrorLogOscillator be ok', () => {
    const expectedData = ['test_content'];
    const fakeErrorLogManager: ErrorLogManager = <any> new EventEmitter;
    const errorLogOscillator = new ErrorLogOscillator(fakeErrorLogManager);
    let gotData;
    errorLogOscillator.on('oscillate', (data) => {
      gotData = data;
    });
    errorLogOscillator.start();
    fakeErrorLogManager.emit('dump', expectedData);
    expect(gotData).to.be.equal(expectedData);
    errorLogOscillator.stop();
  });

  it('should avoid error be ok', () => {
    const fakeErrorLogManager: ErrorLogManager = <any> new EventEmitter;
    const errorLogOscillator = new ErrorLogOscillator(fakeErrorLogManager);
    errorLogOscillator.on('oscillate', (data) => {
      throw new Error('fakeError');
    });
    errorLogOscillator.start();
    fakeErrorLogManager.emit('dump', []);
    errorLogOscillator.stop();
  });

});
