import {join} from 'path';
import {homedir} from 'os';
import {BaseEnvironment} from './BaseEnvironment';
export class DefaultEnvironment extends BaseEnvironment {
  constructor(variables?: any) {
    variables = variables || {};
    if(!variables.env) {
      switch (process.env.NODE_ENV) {
        case 'production':
          variables.env = 'production';
          break;
        case 'prepub':
          variables.env = 'prepub';
          break;
        case 'test':
        case 'unittest':
          variables.env = 'test';
          break;
        default:
          variables.env = 'development';
          break;
      }
    }
    if(!variables.pandoraLogsDir) {
      variables.pandoraLogsDir = join(homedir(), 'logs');
    }
    super(variables);
  }

  match(name: string): boolean {
    return this.get('env') === name;
  }
}