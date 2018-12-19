export interface EnvrionmentCtor {
  new(appDir?: string, variables?: any): Environment;
}

export interface Environment {
  /**
   * Get a variable from Environment
   * Some reserve name:
   *   * env -> Current environment identify name
   * @param {string} name
   * @return {any}
   */
  get(name: string): any;

  /**
   * Given a environment identify name, determine it is match the current environment
   * @param {string} name
   * @return {boolean}
   */
  match(name: string): boolean;
}

export interface EnvironmentManager {

  is(name: string): boolean;

  getCurrentEnvironment(): Environment;

  setCurrentEnvironment(env: Environment): void;

  isReady(): boolean;

}
