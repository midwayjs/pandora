import { MessengerClient } from '@pandorajs/messenger';
import { ObjectConsumer } from './object-proxying/ObjectConsumer';
import { HubClient } from './hub/HubClient';

export interface Location {
  initialization?: boolean;
  appName?: string;
  processName?: string;
  pid?: string;
  clientId?: string;
}

export interface Selector extends Location {
  objectName?: string;
  objectTag?: string;
}

export const selectorSchema = [
  'clientId',
  'appName',
  'processName',
  'pid',
  'objectName',
  'tag',
];

export interface ObjectMessage extends HubMessage {
  propertyName: string;
}

export interface SubscribeMessage extends HubMessage {
  register: string;
}

export interface HubMessage extends MessagePackage {
  action: string;
}

export interface MessagePackage {
  needReply?: boolean;
  broadcast?: boolean;
  host?: Selector;
  remote?: Selector;
  data?: any;
  timeout?: number;
}

export interface ReplyPackage extends MessagePackage {
  success?: boolean;
  error?: any;
  batchReply?: Array<ReplyPackage>;
}

export interface PublishPackage extends MessagePackage {
  broadcast?: null;
  remote?: null;
  data: {
    selector: Selector;
  };
}

export interface LookupPackage extends MessagePackage {
  broadcast?: null;
  remote?: null;
  data: {
    selector: Selector;
  };
}

export interface ForceReplyFn {
  (ReplyPackage): void;
}

export interface SelectedInfo {
  client: MessengerClient;
  selector: Selector;
}

export interface DispatchHandler {
  dispatch(message: HubMessage): Promise<any> | any;
}

export interface ObjectDescription {
  name: string;
  tag?: string;
}

export interface Introspection {
  properties: Array<{
    name: string;
    type: string;
  }>;
  methods: Array<{
    type: string;
    name: string;
    length: number;
  }>;
}

export interface ObjectProxyBehaviour {
  host: {
    invoke(host: any, method: string, params: any[]): Promise<any>;
    getProperty(host: any, name: string): Promise<any>;
    introspect(host: any): Introspection;
    subscribe(
      hub: HubClient,
      objectDescription: ObjectDescription,
      host: any,
      register: string
    ): Promise<any>;
    unsubscribe(
      hub: HubClient,
      objectDescription: ObjectDescription,
      host: any,
      register: string
    ): Promise<any>;
  };
  proxy: {
    invoke(
      proxy: any,
      consumer: ObjectConsumer,
      method: string,
      params: any[]
    ): Promise<any>;
    getProperty(
      proxy: any,
      consumer: ObjectConsumer,
      name: string
    ): Promise<any>;
    subscribe(proxy, consumer: ObjectConsumer, register: string, fn);
    unsubscribe(proxy, consumer: ObjectConsumer, register: string, fn?);
  };
}

export interface ClientOptions {
  location: Location;
  logger?: any;
}

export type FacadeSetupOptions = ClientOptions;

export interface ConsumerExtInfo {
  timeout: number;
}
