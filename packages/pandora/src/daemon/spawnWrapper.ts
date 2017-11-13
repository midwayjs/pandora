'use strict';

const wrap = require('spawn-wrap');
import {MonitorManager} from '../monitor/MonitorManager';

try {
  MonitorManager.injectProcessMonitor();
} catch (err) {
  console.log(err);
}
wrap.runMain();
