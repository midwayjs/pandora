import {WorkerContextAccessor} from './application/WorkerContextAccessor';
import {ServiceCore} from './service/ServiceCore';
import {ServiceContextAccessor} from './service/ServiceContextAccessor';
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
  entryFileBaseDir?: string;
  entryFile?: string;
  scale?: ProcessScale;
  mode?: string;
}

export interface ProcessRepresentation extends ApplicationRepresentation {
  processName: string;
  order?: number;
  scale?: ProcessScale;
  env?: any;
  argv?: any[];
  service?: Array<ServiceRepresentation>;
}

// For ProcessMaster
export interface ApplicationStructureRepresentation extends ApplicationRepresentation {
  process: Array<ProcessRepresentation>;
}

export type MountRepresentation = ApplicationStructureRepresentation | ProcessRepresentation;

// For Daemon
export interface ComplexApplicationStructureRepresentation {
  mount: Array<MountRepresentation>;
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
  context: WorkerContextAccessor;
  representation: ServiceRepresentation;
  depInstances: DepInstances;
}

export interface DepInstances {
  [serviceNmae: string]: ServiceCore;
}

export {MessengerClient, MessengerServer} from 'pandora-messenger';

export interface ServiceConstructor {
  dependencies: string[];
  getProxy(): Service;
}

export interface Service {

  context?: ServiceContextAccessor;

  start?(): Promise<void> | void;

  stop?(): Promise<void> | void;

}


// ************************
// Daemon Introspection

export interface ApplicationIntrospectionResult {
  state: State;
  mode: string;
  name: string;
  appDir: string;
  appId: string;
  pids: number[];
  startCount: number;
  uptime: number;
  representation?: ApplicationRepresentation;
  complex?: ComplexApplicationStructureRepresentation;
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
}



// ************************
// Other

export {Environment} from 'pandora-env';
export {LoggerService, LoggerConfig, ILogger} from 'pandora-service-logger';


