import { Patcher } from '../Patcher';
import * as semver from 'semver';
import * as http from 'http';
import * as https from 'https';
import { HttpClientWrapper } from './wrappers/http-client/HttpClientWrapper';
import { HttpClientPatcherOptions } from '../domain';

export class MySQLPatcher extends Patcher {
  protected options: HttpClientPatcherOptions;
  protected _moduleName = 'httpClient';
  protected wrapper: HttpClientWrapper;
  protected wrapHttps: boolean = semver.satisfies(<any>process.version, '<0.11 || >=9.0.0 || 8.9.0');

  constructor(ctx) {
    super(ctx);
    const KWrapper = this.options.kWrapper || HttpClientWrapper;
    this.wrapper = new KWrapper(this.ctx, this.options);
  }

  target() {
    return {
      http,
      https
    };
  }

  attach() {
    const target = this.target();

    this.wrapper.wrap(target.http);

    if (this.wrapHttps || this.options.forcePatchHttps) {
      this.wrapper.wrap(target.https);
    }
  }

  unattach() {
    const target = this.target();
    this.wrapper.unWrap(target.http);

    if (this.wrapHttps || this.options.forcePatchHttps) {
      this.wrapper.unWrap(target.https);
    }
  }
}