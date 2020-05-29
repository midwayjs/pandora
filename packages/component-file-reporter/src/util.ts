import * as api from '@opentelemetry/api';

export function hrTimeToMilliseconds(hrTime: api.HrTime): number {
  return Math.round(hrTime[0] * 1e3 + hrTime[1] / 1e6);
}
