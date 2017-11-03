import {MessengerClient} from 'pandora-messenger';

export interface Location {
  unknown?: boolean;
  appName?: string;
  processName?: string;
  pid?: string;
}

export interface Selector extends Location {
  serviceName?: string;
  tag?: string;
  method?: string;
}

export const selectorSchema  = [
  'appName',
  'processName',
  'pid',
  'serviceName',
  'tag',
  'method'
];

export interface MessagePackage {
  needReply?: boolean;
  broadcast?: boolean;
  host?: Selector;
  remote?: Selector;
  data?: any;
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
    selector: Selector
  };
}

export interface LookupPackage extends MessagePackage {
  broadcast?: null;
  remote?: null;
  data: {
    selector: Selector
  };
}

export interface ForceReplyFn {
  (ReplyPackage): void;
}

export interface SelectedInfo {
  client: MessengerClient;
  selector: Selector;
}
