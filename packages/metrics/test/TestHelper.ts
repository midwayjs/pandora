import {EnvironmentUtil} from 'pandora-env';
import {MockEnvironment} from './MockEnvironment';
const events = require('events');
// 防止messenger绑定太多事件输出警告
events.defaultMaxListeners = 100;
process.env.NODE_ENV = 'test';
// setup mock env
EnvironmentUtil.getInstance().setCurrentEnvironment(new MockEnvironment());

// install sinon-chai
// require('chai').use(require('sinon-chai'));

