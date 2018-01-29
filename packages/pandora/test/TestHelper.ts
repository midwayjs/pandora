import chai = require('chai');
import chaiAsPromised = require('chai-as-promised');
import {getPandoraLogsDir} from '../src/universal/LoggerBroker';
chai.use(chaiAsPromised);

const events = require('events');
events.defaultMaxListeners = 100;
import {DefaultEnvironment, EnvironmentUtil} from 'pandora-env';

process.env.DEFAULT_WORKER_COUNT = '2';
process.env.SKIP_IPC_HUB = 'true';

EnvironmentUtil.getInstance().setCurrentEnvironment(new DefaultEnvironment({
  env: 'test',
  appName: 'test',
  appDir: '-',
  processName: 'test',
  pandoraLogsDir: getPandoraLogsDir
}));

