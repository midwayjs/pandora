import { IWrapper, HttpClientPatcherOptions } from '../../../domain';
import * as shimmer from '../../../Shimmer';
import { nodeVersion } from '../../../utils';

export class HttpClientWrapper implements IWrapper {
  ctx: any;
  options: HttpClientPatcherOptions;

  constructor(ctx: any, options: HttpClientPatcherOptions) {
    this.ctx = ctx;
    this.options = options;
  }

  wrap(target: any): void {
    shimmer.wrap(target, 'request', this.httpRequestWrapper);

    if (nodeVersion('>=8')) {
      shimmer.wrap(target, 'get', this.httpRequestWrapper);
    }
  }

  httpRequestWrapper() {

  }

  unwrap(target: any): void {
    shimmer.unwrap(target, 'request');

    if (nodeVersion('>=8')) {
      shimmer.unwrap(target, 'get');
    }
  }
}