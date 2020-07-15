import { Transport as EggTransport, TransportOptions } from 'egg-logger';

export class Transport extends EggTransport {
  options: TransportOptions & {
    file?: string;
  };
}

declare module 'egg' {
  interface EggApplication {
    pandora: any;
  }
}
