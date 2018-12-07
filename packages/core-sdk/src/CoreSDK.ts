import * as os from 'os';
import * as path from 'path';
import * as extend from 'extend';
import {IComponentDeclaration, IComponentDeclarationStrict, ICoreSDKOptions} from './domain';
import {IComponent, ComponentReflector} from 'pandora-component-decorator';
import {ComponentWeightCalculator, ISortedItem} from './ComponentWeightCalculator';
import * as defaultConfig from './pandoraConfig';
import {dirname} from 'path';
import {promisify} from 'util';
const resolve = promisify(require('resolve'));


export class CoreSDK {

  protected options: ICoreSDKOptions;
  protected coreContext: any = {};
  protected config: any = {};
  protected components: Map<string, IComponentDeclaration> = new Map();
  protected componentInstances: Map<string, IComponent> = new Map();

  constructor(options: ICoreSDKOptions) {
    this.options = options;
    this.coreContext.config = this.config;
    this.loadConfig(defaultConfig, dirname(require.resolve('./pandoraConfig')));
  }

  async start(): Promise<void> {
    this.loadConfigFromDefaultPlaces();
    await this.loadComponentsFromConfig();
    if(this.options.mode === 'supervisor') {
      return this.startAtSupervisor();
    }
    return this.startAtWorker();
  }

  protected async startAtWorker(): Promise<void> {
    const startQueue = this.getStartQueue();
    for(const { name } of startQueue) {
      const instance: IComponent = this.getInstance(name);
      if(instance.start) {
        await instance.start();
      }
    }
  }

  protected async startAtSupervisor(): Promise<void> {
    const startQueue = this.getStartQueue();
    for(const { name } of startQueue) {
      const instance: IComponent = this.getInstance(name);
      if(instance.startAtSupervisor) {
        await instance.startAtSupervisor();
      }
    }
  }

  protected getInstance(name): IComponent {
    if(!this.componentInstances.has(name)) {
      const componentDeclaration = this.components.get(name);
      const { klass: Klass } = componentDeclaration;
      const instance: IComponent = new Klass(this.coreContext);
      this.componentInstances.set(name, instance);
    }
    return this.componentInstances.get(name);
  }

  protected getStartQueue(): ISortedItem[] {
    const calculator = new ComponentWeightCalculator(this.components);
    return calculator.getSortedComponentNames('asc');
  }

  protected loadConfigFromDefaultPlaces() {
    const configLoadDirs = ['/etc/', os.homedir(), process.cwd()];
    for(const dir of configLoadDirs) {
      try {
        const tartget = path.join(dir, 'pandoraConfig');
        const extConfig = require(tartget);
        this.loadConfig(extConfig, dir);
      } catch(err) {
        // ignore
      }
    }
  }

  protected loadConfig(extConfig: any, configDir: string) {
    const components: {[name: string]: Partial<IComponentDeclaration>} = extConfig.components;
    if(components) {
      for(const comp of Object.values(components)) {
        comp.configDir = configDir;
      }
    }
    extend(true, this.config, extConfig);
  }

  protected async loadComponentsFromConfig() {
    const components: {[name: string]: Partial<IComponentDeclaration>} = this.config.components;
    for(const name of Object.keys(components)) {
      const {path, configDir} = components[name];
      const resolvedPath = await resolve(path, {basedir: configDir});
      let klass = require(resolvedPath);
      klass = klass.default ? klass.default : klass;

      const dependencies = ComponentReflector.getDependencies(klass) || [];
      const metaName = ComponentReflector.getComponentName(klass);

      if(metaName && metaName !== name) {
        throw new Error(`Component decorated name ${metaName}, but config name is ${name}`);
      }

      this.addComponent({ name, path, klass, dependencies });
    }
  }

  protected addComponent(component: IComponentDeclarationStrict) {
    this.components.set(component.name, component);
  }


  async stop(): Promise<void> {
    // TODO: do something here
  }

}