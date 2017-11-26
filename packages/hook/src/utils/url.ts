'use strict';

const url = require('url');

/**
 * 提取 path 信息，去掉尾部反斜杠
 * @param requestUrl
 * @returns {string}
 */
export function scrub(requestUrl) {
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