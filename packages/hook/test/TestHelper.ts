import {EnvironmentUtil} from 'pandora-env';
import {MockEnvironment} from './MockEnvironment';
const events = require('events');
events.defaultMaxListeners = 100;
process.env.NODE_ENV = 'test';
// setup mock env
EnvironmentUtil.getInstance().setCurrentEnvironment(new MockEnvironment());
