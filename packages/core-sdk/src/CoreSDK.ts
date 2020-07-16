import * as os from 'os';
import * as path from 'path';
import * as extend from 'extend';
import {
  IComponentDeclaration,
  IComponentDeclarationStrict,
  ICoreSDKOptions,
} from './types';
import { IComponent, ComponentReflector } from '@pandorajs/component-decorator';
import {
  ComponentWeightCalculator,
  ISortedItem,
} from './ComponentWeightCalculator';
import * as defaultConfig from './pandoraConfig';
import { dirname } from 'path';
import { Logger } from 'egg-logger';
import { Resource } from '@opentelemetry/resources';

const resolve = require('resolve');
const debug = require('debug')('pandora:CoreSDK');

export class CoreSDK {
  public coreContext: any;
  protected options: ICoreSDKOptions;
  protected components: Map<string, IComponentDeclaration> = new Map();
  protected componentInstances: Map<string, IComponent> = new Map();
  protected instantiated = false;

  get config(): any {
    return this.coreContext.config;
  }

  set config(newConfig) {
    this.coreContext.config = newConfig;
  }

  constructor(options: ICoreSDKOptions) {
    this.options = options;

    // TODO: pandora version detection.
    let resource = Resource.createTelemetrySDKResource();
    if (options.resource) {
      resource = resource.merge(options.resource);
    }

    this.coreContext = {
      mode: options.mode,
      appName: options.appName,
      appDir: options.appDir,
      processName: options.processName || options.mode,
      resource,
      config: {},
      logger: new Logger({}),
    };
    debug('constructing CoreSDK %j', options);
    if (this.options.extendContext) {
      Object.assign(this.coreContext, this.options.extendContext);
    }
    this.loadConfig(defaultConfig, dirname(require.resolve('./pandoraConfig')));
  }

  instantiate() {
    if (this.instantiated) {
      return;
    }
    this.loadConfigFromDefaultPlaces();
    this.loadComponentsFromConfig();
    const startQueue = this.getStartQueue();
    for (const { name } of startQueue) {
      this.getInstance(name);
    }
    this.instantiated = true;
  }

  async start(): Promise<void> {
    this.instantiate();
    if (this.coreContext.mode === 'supervisor') {
      return this.startAtSupervisor();
    }
    return this.startAtWorker();
  }

  protected async startAtWorker(): Promise<void> {
    const startQueue = this.getStartQueue();
    for (const { name } of startQueue) {
      const instance: IComponent = this.getInstance(name);
      if (instance.start) {
        await instance.start();
        debug(`started component ${name} at worker`);
      }
    }
  }

  protected async startAtSupervisor(): Promise<void> {
    const startQueue = this.getStartQueue();
    for (const { name } of startQueue) {
      const instance: IComponent = this.getInstance(name);
      if (instance.startAtSupervisor) {
        await instance.startAtSupervisor();
        debug(`started component ${name} at supervisor`);
      }
    }
  }

  async stop(): Promise<void> {
    if (this.coreContext.mode === 'supervisor') {
      return this.stopAtSupervisor();
    }
    return this.stopAtWorker();
  }

  protected async stopAtWorker(): Promise<void> {
    const stopQueue = this.getStopQueue();
    for (const { name } of stopQueue) {
      const instance: IComponent = this.getInstance(name);
      if (instance.stop) {
        await instance.stop();
        debug(`stopped component ${name} at worker`);
      }
    }
  }

  protected async stopAtSupervisor(): Promise<void> {
    const stopQueue = this.getStopQueue();
    for (const { name } of stopQueue) {
      const instance: IComponent = this.getInstance(name);
      if (instance.stopAtSupervisor) {
        await instance.stopAtSupervisor();
        debug(`stopped component ${name} at supervisor`);
      }
    }
  }

  protected getInstance(name): IComponent {
    if (!this.componentInstances.has(name)) {
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

  protected getStopQueue(): ISortedItem[] {
    const calculator = new ComponentWeightCalculator(this.components);
    return calculator.getSortedComponentNames('desc');
  }

  protected loadConfigFromDefaultPlaces() {
    const configLoadDirs = ['/etc/', os.homedir(), process.cwd()];
    for (const dir of configLoadDirs) {
      try {
        const target = path.join(dir, 'pandoraConfig');
        const extConfig = require(target);
        this.loadConfig(extConfig, dir);
      } catch (err) {
        // ignore
      }
    }

    if (this.options.extendConfig) {
      for (const { config, configDir } of this.options.extendConfig) {
        this.loadConfig(config, configDir);
      }
    }
  }

  protected loadConfig(
    extConfig: any,
    configDir: string,
    reverseExtend = false
  ) {
    debug('loadConfig configDir %s, config %j', configDir, extConfig);
    const components: { [name: string]: Partial<IComponentDeclaration> } =
      extConfig.components;
    if (components) {
      for (const comp of Object.values(components)) {
        comp.configDir = configDir;
      }
    }
    if (reverseExtend) {
      this.config = extend(true, extConfig, this.config);
    } else {
      extend(true, this.config, extConfig);
    }
  }

  protected loadComponentsFromConfig() {
    const components: { [name: string]: Partial<IComponentDeclaration> } = this
      .config.components;
    for (const name of Object.keys(components)) {
      const { path, configDir } = components[name];
      const resolvedPath = resolve.sync(path, {
        basedir: configDir,
        extensions: ['.js', '.ts'],
      });
      let klass = require(resolvedPath);
      klass = klass.default ? klass.default : klass;

      const dependencies = ComponentReflector.getDependencies(klass) || [];
      const metaName = ComponentReflector.getComponentName(klass);
      const componentDefaultConfig = ComponentReflector.getComponentConfig(
        klass
      );

      if (metaName && metaName !== name) {
        throw new Error(
          `Component decorated name ${metaName}, but config name is ${name}`
        );
      }

      if (componentDefaultConfig) {
        this.loadConfig(componentDefaultConfig, dirname(resolvedPath), true);
      }

      this.addComponent({ name, path, klass, dependencies });
    }
  }

  protected addComponent(component: IComponentDeclarationStrict) {
    debug(`addComponent ${component.name}`);
    this.components.set(component.name, component);
  }
}
