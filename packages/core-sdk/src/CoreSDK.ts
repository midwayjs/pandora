import * as os from 'os';
import * as path from 'path';
import * as extend from 'extend';
import {IComponent, IComponentDeclaration, IComponentDeclarationStrict, ICoreSDKOptions} from './domain';
import {ComponentWeightCalculator, ISortedItem} from './ComponentWeightCalculator';
import {ComponentReflector} from './ComponentReflector';
import * as defaultConfig from './pandoraConfig';


export class CoreSDK {

  protected options: ICoreSDKOptions;
  protected coreContext: any = {};
  protected config: any = {};
  protected components: Map<string, IComponentDeclaration>;
  protected componentInstances: Map<string, IComponent>;

  constructor(options: ICoreSDKOptions) {
    this.options = options;
    this.coreContext.config = this.config;
    this.loadConfig(defaultConfig);
  }

  async start(): Promise<void> {
    this.loadConfigFromDefaultPlaces();
    this.loadComponentsFromConfig();
    if(this.options.mode === 'supervisor') {
      return this.startAtSupervisor();
    }
    return this.startAtWorker();
  }

  protected async startAtWorker(): Promise<void> {
    const startQueue = this.getStartQueue();
    for(const { name } of startQueue) {
      const instance: IComponent = this.getInstance(name);
      await instance.startAtSupervisor();
    }
  }

  protected async startAtSupervisor(): Promise<void> {
    const startQueue = this.getStartQueue();
    for(const { name } of startQueue) {
      const instance: IComponent = this.getInstance(name);
      await instance.startAtSupervisor();
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
        this.loadConfig(extConfig);
      } catch(err) {
        // ignore
      }
    }
  }

  protected loadConfig(extConfig: any) {
    extend(true, this.config, extConfig);
  }

  protected loadComponentsFromConfig() {
    const components: {[name: string]: IComponentDeclaration} = this.config.components;
    for(const key of Object.keys(components)) {
      const {name, path} = components[key];
      const klass = require(path);
      const dependencies = ComponentReflector.getDependencies(klass) || [];
      this.addComponent({ name, path, klass, dependencies });
    }
  }

  protected addComponent(component: IComponentDeclarationStrict) {
    this.components.set(component.name, component);
  }

}