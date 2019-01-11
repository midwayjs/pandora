import * as url from 'url';
import { UrlWithStringQuery, URL } from 'url';
import * as semver from 'semver';
import { RequestOptions } from 'http';

/**
 * 提取 path 信息，去掉尾部反斜杠
 * @param requestUrl {string|UrlWithStringQuery}
 * @returns {string}
 */
export function extractPath(requestUrl: string | UrlWithStringQuery): string {
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