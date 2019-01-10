import { IWrapper, MySQLPatcherOptions } from '../../../domain';
import * as shimmer from '../../../Shimmer';

export class MySQLWrapper implements IWrapper {

  constructor(ctx: any, options: MySQLPatcherOptions) {

  }

  wrap(target: any): void {}

  unWrap(target: any): void {}
}