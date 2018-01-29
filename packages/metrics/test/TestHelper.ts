import {EnvironmentUtil} from 'pandora-env';
import {MockEnvironment} from './MockEnvironment';
import {MetricsServerManager} from '../src/MetricsServerManager';
import {MetricsInjectionBridge} from '../src/util/MetricsInjectionBridge';
const events = require('events');
events.defaultMaxListeners = 100;
process.env.NODE_ENV = 'test';
// setup mock env
EnvironmentUtil.getInstance().setCurrentEnvironment(new MockEnvironment());
const manager = MetricsServerManager.getInstance();
MetricsInjectionBridge.setMetricsManager(manager);
