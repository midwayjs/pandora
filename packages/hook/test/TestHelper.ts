import {EnvironmentUtil} from 'pandora-env';
import {MockEnvironment} from './MockEnvironment';
import { MetricsClient, MetricsClientUtil } from 'pandora-metrics';
const events = require('events');
events.defaultMaxListeners = 100;
process.env.NODE_ENV = 'test';
// setup mock env
EnvironmentUtil.getInstance().setCurrentEnvironment(new MockEnvironment());
MetricsClientUtil.setMetricsClient(MetricsClient.getInstance());
