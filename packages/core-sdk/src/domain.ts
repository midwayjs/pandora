export type ICoreSDKMode = 'supervisor' | 'worker';
import {IComponentConstructor} from 'pandora-component-decorator';

export interface ICoreSDKOptions {
  mode: ICoreSDKMode;
  appName: string;
  appDir: string;
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
