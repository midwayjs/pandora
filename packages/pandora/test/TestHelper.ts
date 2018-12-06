import chai = require('chai');
import chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const events = require('events');
events.defaultMaxListeners = 100;

process.env.DEFAULT_WORKER_COUNT = '2';
process.env.SKIP_IPC_HUB = 'true';
