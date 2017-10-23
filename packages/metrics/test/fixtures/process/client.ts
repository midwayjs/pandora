import {ProcessIndicator} from '../../../src/indicator/impl/ProcessIndicator';
import {EnvironmentUtil} from 'pandora-env';
import {MockEnvironment} from '../../MockEnvironment';
EnvironmentUtil.getInstance().setCurrentEnvironment(new MockEnvironment());

console.log('--///----');
let indicator = new ProcessIndicator();
indicator.initialize();
let total = 0;
console.log('------');
setInterval(() => {
  total += Math.random();
}, 100);
