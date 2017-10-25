import {WorkerContextAccessor} from './application/WorkerContextAccessor';
import {SimpleServiceCore} from './service/SimpleServiceCore';

export type ProcessScale = number | 'auto';
export type CategoryReg = string | 'all';
export type Entry = string | {
  new(...x): any;
};

export interface EntryClass {
  new(...x): any;
}

export interface ApplicationRepresentation {
  appName: string;
  appDir: string;
  entryFile?: string;
  scale?: ProcessScale;
  injectMonitoring?: boolean;
  mode?: string;
}

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


export interface ProcessRepresentation extends ApplicationRepresentation {
  processName: string;
  order?: number;
  scale?: ProcessScale;
  env?: any;
  argv?: any[];
  applet?: Array<AppletRepresentation>;
}

export interface ApplicationStructureRepresentation {
  debug?: boolean;
  process: Array<ProcessRepresentation>;
}


export type ServiceWorkMode = 'agent' | 'worker' | null;

export interface ServiceRepresentation {
  serviceEntry: Entry;
  serviceName: string;
  category?: CategoryReg;
  config?: any;
  configResolver?: (context: any, oldConfig?: any) => any;
  dependencies?: Array<string>;
}

export interface ServiceInstanceReference {

  serviceInstance?: Service;
  serviceCoreInstance?: ServiceCore;

  serviceRepresentation: ServiceRepresentation;
  state: 'noinstance' | 'instanced' | 'booting' | 'booted' | 'stopping';
  depInstances?: DepInstances;
}

export interface ServiceOptions {
  messengerClient?: any;
  messengerServer?: any;
  workMode: ServiceWorkMode;
  context: WorkerContextAccessor;
  representation: ServiceRepresentation;
  depInstances: DepInstances;
}


export interface DepInstances {
  [serviceNmae: string]: ServiceCore;
}

// 消息定义
export interface ServiceMessageInvokeMethod {
  name: string;
  args: any[];
}

export interface ServiceMessageSubscribeEvent {
  name: string;
  listener: string;
}

export interface ServiceMessageUnsubscribeEvent {
  name: string;
  listener: string;
}

export interface ServiceMessageDispatchEvent {
  name: string;
  listener: string;
  event: any;
}

export interface ServiceMessagePkg {
  type: 'service-ping-remote' | 'service-invoke-method' | 'service-subscribe-event'
    | 'service-unsubscribe-event' | 'service-dispatch-event';
  serviceId: string;
  payload?: ServiceMessageInvokeMethod | ServiceMessageInvokeMethod
    | ServiceMessageUnsubscribeEvent | ServiceMessageDispatchEvent;
}

export {MessengerClient, MessengerServer} from 'pandora-messenger';


export interface ServiceCore extends SimpleServiceCore {
}


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

  subscribe?(reg, fn): Promise<void> | void;

  unsubscribe?(reg, fn): Promise<void> | void;

}

export {Environment} from 'pandora-env';
export {LoggerService, LoggerConfig, ILogger} from 'pandora-service-logger';


export interface ConfiguratorLoadOptions {
  force: boolean;
}

export interface Configurator {
  getAllProperties(options?: ConfiguratorLoadOptions): Promise<any> | any;
}

