export type ICoreSDKMode = string;
import { IComponentConstructor } from '@pandorajs/component-decorator';
import { Resource } from '@opentelemetry/resources';

export interface ICoreSDKOptions {
  mode: ICoreSDKMode;
  appName: string;
  resource?: Resource;
  processName?: string;
  extendConfig?: Array<{
    config: any;
    configDir: string;
  }>;
  extendContext?: any;
}

export interface IComponentDeclaration {
  name: string;
  path: string;
  dependencies?: string[];
  klass?: IComponentConstructor;
  configDir?: string;
}

export interface IComponentDeclarationStrict extends IComponentDeclaration {
  dependencies: string[];
  klass: IComponentConstructor;
}
