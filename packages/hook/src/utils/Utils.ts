/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

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

export function argSlice(args) {
  const length = args.length;
  const array = new Array(length);

  for (let i = 0; i < length; i++) {
    array[i] = args[i];
  }

  return array;
}

export function parseParameters(requestUrl) {
  let parsed = requestUrl;

  if (typeof requestUrl === 'string') {
    parsed = url.parse(requestUrl, true);
  }

  const parameters = {};

  if (parsed.query) {
    const keys = Object.keys(parsed.query);

    for (let i = 0, l = keys.length; i < l; ++i) {
      let key = keys[i];
      if (parsed.query[key] === '' && parsed.path.indexOf(key + '=') === -1) {
        parameters[key] = true;
      } else {
        parameters[key] = parsed.query[key];
      }
    }
  }

  return parameters;
}

export function scrubAndParseParameters(requestUrl) {
  if (typeof requestUrl === 'string') {
    requestUrl = url.parse(requestUrl, true);
  }

  return {
    path: scrub(requestUrl),
    parameters: parseParameters(requestUrl)
  };
}