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
const debug = require('debug')('pandora:CoreSDK');


export class CoreSDK {

  public coreContext: any;
  protected options: ICoreSDKOptions;
  protected components: Map<string, IComponentDeclaration> = new Map();
  protected componentInstances: Map<string, IComponent> = new Map();

  get config(): any {
    return this.coreContext.config;
  }

  set config(newConfig) {
    this.coreContext.config = newConfig;
  }

  constructor(options: ICoreSDKOptions) {
    this.options = options;
    this.coreContext = {
      mode: options.mode,
      appName: options.appName,
      appDir: options.appDir,
      processName: options.processName || options.mode,
      config: {}
    };
    if(this.options.extendContext) {
      Object.assign(this.coreContext, this.options.extendContext);
    }
    this.loadConfig(defaultConfig, dirname(require.resolve('./pandoraConfig')));
  }

  async start(): Promise<void> {
    this.loadConfigFromDefaultPlaces();
    await this.loadComponentsFromConfig();
    if(this.coreContext.mode === 'supervisor') {
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
        debug(`started component ${name} at worker`);
      }
    }
  }

  protected async startAtSupervisor(): Promise<void> {
    const startQueue = this.getStartQueue();
    for(const { name } of startQueue) {
      const instance: IComponent = this.getInstance(name);
      if(instance.startAtSupervisor) {
        await instance.startAtSupervisor();
        debug(`started component ${name} at supervisor`);
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
        const target = path.join(dir, 'pandoraConfig');
        const extConfig = require(target);
        this.loadConfig(extConfig, dir);
      } catch(err) {
        // ignore
      }
    }

    if(this.options.extendConfig) {
      for(const {config, configDir} of this.options.extendConfig) {
        this.loadConfig(config, configDir);
      }
    }
  }

  protected loadConfig(extConfig: any, configDir: string, reverseExtend: boolean = false) {
    const components: {[name: string]: Partial<IComponentDeclaration>} = extConfig.components;
    if(components) {
      for(const comp of Object.values(components)) {
        comp.configDir = configDir;
      }
    }
    if(reverseExtend) {
      this.config = extend(true, extConfig, this.config);
    } else {
      extend(true, this.config, extConfig);
    }
  }

  protected async loadComponentsFromConfig() {
    const components: {[name: string]: Partial<IComponentDeclaration>} = this.config.components;
    for(const name of Object.keys(components)) {
      const {path, configDir} = components[name];
      const resolvedPath = await resolve(path, {
        basedir: configDir,
        extensions: ['.js', '.ts']
      });
      let klass = require(resolvedPath);
      klass = klass.default ? klass.default : klass;

      const dependencies = ComponentReflector.getDependencies(klass) || [];
      const metaName = ComponentReflector.getComponentName(klass);
      const componentDefaultConfig = ComponentReflector.getComponentConfig(klass);

      if(metaName && metaName !== name) {
        throw new Error(`Component decorated name ${metaName}, but config name is ${name}`);
      }

      if(componentDefaultConfig) {
        this.loadConfig(componentDefaultConfig, dirname(resolvedPath), true);
      }

      this.addComponent({ name, path, klass, dependencies });
    }
  }

  protected addComponent(component: IComponentDeclarationStrict) {
    debug(`addComponent ${component.name}`);
    this.components.set(component.name, component);
  }


  async stop(): Promise<void> {
    // TODO: do something here
  }

}