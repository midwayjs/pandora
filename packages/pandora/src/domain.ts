import {WorkerContextAccessor} from './application/WorkerContextAccessor';
import {ServiceCore} from './service/ServiceCore';

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
  processName?: string;
  order?: number;
  scale?: ProcessScale;
  env?: any;
  argv?: any[];
  applet?: Array<AppletRepresentation>;
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
// Applet

export interface AppletOptions {
  appletName: string;
  category: string;
  config: any;
  context: WorkerContextAccessor;
}

export interface AppletConstructor {
  new(options: AppletOptions): Applet;
}

export interface Applet {
  start(): Promise<void>;
  stop(): Promise<void>;
}

export interface AppletRepresentation {
  appletEntry: Entry;
  appletName: string;
  category?: CategoryReg;
  config?: any;
  configResolver?: (context: any, oldConfig?: any) => any;
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

  core?: ServiceCore;

  start?(): Promise<void> | void;

  stop?(): Promise<void> | void;

  handleSubscribe?(reg, fn): Promise<void> | void;

  handleUnsubscribe?(reg, fn): Promise<void> | void;

}

// ************************
// Other

export {Environment} from 'pandora-env';
export {LoggerService, LoggerConfig, ILogger} from 'pandora-service-logger';

export interface ConfiguratorLoadOptions {
  force: boolean;
}

export interface Configurator {
  getAllProperties(options?: ConfiguratorLoadOptions): Promise<any> | any;
}

