/**
 * Interface and Constant
 */
import {Facade} from './Facade';
import delegate = require('delegates');

export * from './domain';
export * from './const';

/**
 * Daemon
 */
export * from './daemon/Daemon';
export * from './daemon/DaemonHandler';
export * from './monitor/Monitor';
export {DaemonBootstrap} from './daemon/DaemonBootstrap';

/**
 * Application
 */
export * from './application/ProcessHandler';
export * from './application/ScalableMaster';

/**
 * Procfile
 */
export * from './application/ProcfileReconciler';
export * from './application/ProcfileReconcilerAccessor';
export * from './application/ServiceRepresentationChainModifier';

/**
 * ProcessContext
 */
export * from './application/ProcessContext';
export {ProcessBootstrap} from './application/ProcessBootstrap';

/**
 * Service
 */
export * from './service/ServiceLogger';
export * from './service/ServiceReconciler';
export * from './service/ServiceCore';

/**
 * Universal
 */
export * from './universal/GlobalConfigProcessor';
export * from './universal/Helpers';
export * from './universal/LoggerBroker';

/**
 * Debug
 */
export * from './debug/DebugApplicationLoader';
export * from './debug/DebugServiceReconciler';

/**
 * Facade
 */
export const facade = Facade.getInstance();
delegate(exports, 'facade')
  .access('processContext')
  .access('appName')
  .access('appDir')
  .access('processName')
  .access('env')
  .access('environment')
  .access('hub')
  .method('getService')
  .method('getServiceClass')
  .method('getHub')
  .method('publishObject')
  .method('getProxy');

export declare const processContext: typeof Facade.prototype.processContext;
export declare const appName: typeof Facade.prototype.appName;
export declare const appDir: typeof Facade.prototype.appDir;
export declare const processName: typeof Facade.prototype.processName;
export declare const env: typeof Facade.prototype.env;
export declare const environment: typeof Facade.prototype.environment;
export declare const getService: typeof Facade.prototype.getService;
export declare const getServiceClass: typeof Facade.prototype.getServiceClass;
export declare const getHub: typeof Facade.prototype.getHub;
export declare const publishObject: typeof Facade.prototype.publishObject;
export declare const getProxy: typeof Facade.prototype.getProxy;
