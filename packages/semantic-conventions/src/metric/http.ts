import { CanonicalCode } from './rpc';

export const HttpAttribute = {
  HTTP_METHOD: 'http.method',
  HTTP_ROUTE: 'http.route',
  HTTP_STATUS_CODE: 'http.status_code',
};

export const HTTP_STATUS_SPECIAL_CASES = {
  401: CanonicalCode.UNAUTHENTICATED,
  403: CanonicalCode.PERMISSION_DENIED,
  404: CanonicalCode.NOT_FOUND,
  429: CanonicalCode.RESOURCE_EXHAUSTED,
  501: CanonicalCode.UNIMPLEMENTED,
  503: CanonicalCode.UNAVAILABLE,
  504: CanonicalCode.DEADLINE_EXCEEDED,
  598: CanonicalCode.INTERNAL,
  599: CanonicalCode.INTERNAL,
};

/**
 * Parse status code from HTTP response. [More details](https://github.com/open-telemetry/opentelemetry-specification/blob/master/specification/data-http.md#status)
 */
export const parseHttpStatusCode = (statusCode: number): CanonicalCode => {
  // search for special case
  const code: number | undefined = HTTP_STATUS_SPECIAL_CASES[statusCode];

  if (code !== undefined) {
    return code;
  }

  // 0xx are unknown
  if (statusCode < 100) {
    return CanonicalCode.UNKNOWN;
  }

  // 1xx, 2xx, 3xx are OK
  if (statusCode < 400) {
    return CanonicalCode.OK;
  }

  // 4xx are client errors
  if (statusCode < 500) {
    return CanonicalCode.INVALID_ARGUMENT;
  }

  // 5xx are internal errors
  if (statusCode < 512) {
    return CanonicalCode.INTERNAL;
  }

  // All other codes are unknown
  return CanonicalCode.UNKNOWN;
};
