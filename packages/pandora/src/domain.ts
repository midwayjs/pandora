import {ProcessContextAccessor} from './application/ProcessContextAccessor';
import {ServiceCore} from './service/ServiceCore';
import {State} from './const';

export type ProcessScale = number | 'auto';
export type CategoryReg = string | 'all' | 'weak-all';
export type Entry = string | {
  new(...x): any;
};

export interface EntryClass {
  new(...x): any;
}

// ************************
// Application and Process

export interface ApplicationRepresentation {
  appName: string;
  appDir: string;
  scale?: ProcessScale;
  globalEnv?: any;
  globalArgv?: any[];
}

export interface ProcessRepresentation extends ApplicationRepresentation {
  processName: string;
  order?: number;
  scale?: ProcessScale;
  env?: any;
  argv?: any[];
  service?: Array<ServiceRepresentation>;
  entryFileBaseDir?: string;
  entryFile?: string;
}

export interface ApplicationStructureRepresentation extends ApplicationRepresentation {
  process: Array<ProcessRepresentation>;
}


// ************************
// Service

export interface ServiceRepresentation {
  serviceEntry: Entry;
  serviceName: string;
  category?: CategoryReg;
  config?: any;
  configResolver?: (context: any, oldConfig?: any) => any;
  dependencies?: Array<string>;
  publishToHub?: boolean;
}

export interface ServiceInstanceReference {
  serviceInstance?: Service;
  serviceCoreInstance?: ServiceCore;
  serviceRepresentation: ServiceRepresentation;
  state: 'noinstance' | 'instanced' | 'booting' | 'booted' | 'stopping';
  depInstances?: DepInstances;
}

export interface ServiceOptions {
  context: ProcessContextAccessor;
  representation: ServiceRepresentation;
  depInstances: DepInstances;
}

export interface DepInstances {
  [serviceNmae: string]: ServiceCore;
}

export {MessengerClient, MessengerServer} from 'pandora-messenger';

export interface ServiceConstructor {
  dependencies: string[];
}

export interface Service {
  // new(context?: ServiceContextAccessor): Service;
  start?(): Promise<void> | void;
  stop?(): Promise<void> | void;
}


// ************************
// Daemon Introspection

export interface ApplicationIntrospectionResult {
  state: State;
  appName: string;
  appDir: string;
  appId: string;
  pids: number[];
  startCount: number;
  restartCount: number;
  uptime: number;
  representation?: ApplicationRepresentation;
  // the field complex for legacy, it is a alias of structure
  complex?: ApplicationStructureRepresentation;
  structure?: ApplicationStructureRepresentation;
  stdoutLogPath?: string;
}

export type VersionsIntrospectionResult = typeof process.versions & {
  pandora: string;
};

export interface DaemonIntrospectionResult {
  versions: VersionsIntrospectionResult;
  cwd: string;
  pid: number;
  uptime: number;
  loadedGlobalConfigPaths: string[];
  loadedEndPoints: string[];
  loadedReporters: string[];
}



// ************************
// Other

export {Environment} from 'pandora-env';
export {LoggerService, LoggerConfig, ILogger} from 'pandora-service-logger';


