export type ICoreSDKMode = string;
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
  enable?: boolean;
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
