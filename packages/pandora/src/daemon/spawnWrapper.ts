'use strict';

const wrap = require('spawn-wrap');
import {MonitorManager} from '../monitor/MonitorManager';

try {
  MonitorManager.injectProcessMonitor();
} catch (err) {
  console.error(err);
}
wrap.runMain();
