export interface Selector {
  appName?: string;
  processName?: string;
  pid?: string;
  serviceName?: string;
  tag?: string;
  method?: string;
}

export interface MessagePackage {
  broadcast: boolean;
  host: Selector;
  remote: Selector;
  code: number;
  error: any;
  data: any;
}