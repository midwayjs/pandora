import url, { UrlWithStringQuery } from 'url';

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