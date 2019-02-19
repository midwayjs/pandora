import * as url from 'url';
import { UrlWithStringQuery, URL } from 'url';
import * as semver from 'semver';
import { RequestOptions } from 'http';
import { IPandoraSpan } from 'pandora-component-trace';

const LOCALHOST_NAMES = {
  'localhost': true,
  '127.0.0.1': true,
  '0.0.0.0': true,
  '0:0:0:0:0:0:0:1': true,
  '::1': true,
  '0:0:0:0:0:0:0:0': true,
  '::': true
};

/**
 * 提取 path 信息，去掉尾部反斜杠
 * @param requestUrl {string|UrlWithStringQuery}
 * @returns {string}
 */
export function extractPath(requestUrl: string | UrlWithStringQuery): string {
  /* istanbul ignore next */
  if (typeof requestUrl === 'string') {
    requestUrl = url.parse(requestUrl);
  }

  let path = requestUrl.pathname;

  if (path) {
    if (path !== '/' && path.charAt(path.length - 1) === '/') {
      path = path.substring(0, path.length - 1);
    }
  } else {
    path = '/';
  }

  return path;
}

export function nodeVersion(rule: string) {
  return semver.satisfies((<NodeJS.Process>process).version, rule);
}

// inspired by https://github.com/nodejs/node/blob/b83088b0bb2b8dfa6ee72a807cc10fe1ac898278/lib/internal/url.js#L1257
// Utility function that converts a URL object into an ordinary
// options object as expected by the http.request and https.request
// APIs.
export function urlToOptions(url: URL): RequestOptions {
  const options = {
    protocol: url.protocol,
    hostname: url.hostname.startsWith('[') ?
      url.hostname.slice(1, -1) :
      url.hostname,
    hash: url.hash,
    search: url.search,
    pathname: url.pathname,
    path: `${url.pathname}${url.search}`,
    href: url.href
  };

  if (url.port !== '') {
    (<RequestOptions>options).port = Number(url.port);
  }

  if (url.username || url.password) {
    (<RequestOptions>options).auth = `${url.username}:${url.password}`;
  }

  return options;
}

export function getDatabaseConfigFromQuery(sql: string) {
  // The character ranges for this were pulled from
  // http://dev.mysql.com/doc/refman/5.7/en/identifiers.html
  const match = /^\s*use[^\w`]+([\w$_\u0080-\uFFFF]+|`[^`]+`)[\s;]*$/i.exec(sql);

  return match && match[1] || null;
}

export function isLocalhost(host) {
  return !!LOCALHOST_NAMES[host];
}

export function recordError(span: IPandoraSpan, error: Error, recordErrorDetail: boolean): void {
  if (!error || !(error instanceof Error)) return;

  span.log({
    error: `[${error.name}] ${error.message}`
  });

  if (recordErrorDetail) {
    span.log({
      errorStack: error.stack
    });
  }
}

export function setInternalProperty(target: any, key: string, value: any, writable: boolean = false) {
  Object.defineProperty(target, key, {
    enumerable: false,
    configurable: true,
    writable,
    value: value
  });
}

export function isURL(value: any): value is URL {
  if (semver.satisfies(process.version, '>=7')) {
    return value instanceof URL;
  }

  return false;
}