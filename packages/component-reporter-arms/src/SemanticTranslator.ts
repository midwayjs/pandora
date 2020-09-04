import { MetricRecord } from '@opentelemetry/metrics';
import {
  RpcMetric,
  GeneralAttribute,
  SystemMetric,
  HttpAttribute,
} from '@pandorajs/semantic-conventions';
import { SummaryPointValue } from '@pandorajs/component-metric';

const SystemMetricNames = [
  SystemMetric.CPU_IDLE,
  SystemMetric.CPU_SYSTEM,
  SystemMetric.CPU_USER,
  SystemMetric.CPU_IO_WAIT,
  SystemMetric.MEM_TOTAL_BYTES,
  SystemMetric.MEM_USED_BYTES,
  SystemMetric.MEM_FREE_BYTES,
  SystemMetric.MEM_CACHED_BYTES,
  SystemMetric.MEM_BUFFERS_BYTES,
  SystemMetric.MEM_SWAP_TOTAL_BYTES,
  SystemMetric.MEM_SWAP_USED_BYTES,
  SystemMetric.MEM_SWAP_FREE_BYTES,
  SystemMetric.DISK_FREE_BYTES,
  SystemMetric.DISK_TOTAL_BYTES,
  SystemMetric.NET_IN_BYTES,
  SystemMetric.NET_IN_ERRS,
  SystemMetric.NET_OUT_BYTES,
  SystemMetric.NET_OUT_ERRS,
];

export default class SemanticTranslator {
  map = {
    [RpcMetric.REQUEST_COUNT + '_no_status']: (
      record: MetricRecord
    ): MetricRecord => {
      return {
        ...record,
        descriptor: {
          ...record.descriptor,
          name: `arms_${
            record.labels[GeneralAttribute.COMPONENT]
          }_requests_total`,
        },
        labels: {
          rpc:
            record.labels[HttpAttribute.HTTP_METHOD] +
            ' ' +
            record.labels[HttpAttribute.HTTP_ROUTE],
          exception: record.labels['exception'],
        },
      };
    },
    [RpcMetric.REQUEST_COUNT]: (record: MetricRecord): MetricRecord => {
      return {
        ...record,
        descriptor: {
          ...record.descriptor,
          name: `arms_${
            record.labels[GeneralAttribute.COMPONENT]
          }_requests_by_status_total`,
        },
        labels: {
          rpc:
            record.labels[HttpAttribute.HTTP_METHOD] +
            ' ' +
            record.labels[HttpAttribute.HTTP_ROUTE],
          exception: record.labels['exception'],
          status: record.labels[HttpAttribute.HTTP_STATUS_CODE],
        },
      };
    },
    [RpcMetric.RESPONSE_ERROR_COUNT]: (record: MetricRecord): MetricRecord => {
      return {
        ...record,
        descriptor: {
          ...record.descriptor,
          name: `arms_${
            record.labels[GeneralAttribute.COMPONENT]
          }_requests_error_total`,
        },
        labels: {
          rpc:
            record.labels[HttpAttribute.HTTP_METHOD] +
            ' ' +
            record.labels[HttpAttribute.HTTP_ROUTE],
          exception: record.labels['exception'],
        },
      };
    },
    [RpcMetric.RESPONSE_DURATION]: (record: MetricRecord): MetricRecord[] => {
      const point = record.aggregator.toPoint();
      let result = [
        {
          ...record,
          descriptor: {
            ...record.descriptor,
            name: `arms_${
              record.labels[GeneralAttribute.COMPONENT]
            }_requests_seconds_total`,
          },
          labels: {
            rpc:
              record.labels[HttpAttribute.HTTP_METHOD] +
              ' ' +
              record.labels[HttpAttribute.HTTP_ROUTE],
            exception: record.labels['exception'],
          },
          aggregator: {
            toPoint: () => {
              return {
                timestamp: point.timestamp,
                value:
                  typeof point.value === 'number'
                    ? point.value / 1000
                    : point.value.sum / 1000,
              };
            },
            update: () => {},
          },
        },
      ];
      if (isSummaryValueType(point.value)) {
        const summary = point.value;
        result = result.concat(
          summary.percentiles.map((it, idx) => {
            return {
              ...record,
              descriptor: {
                ...record.descriptor,
                name: `arms_${
                  record.labels[GeneralAttribute.COMPONENT]
                }_requests_latency_seconds`,
              },
              labels: {
                rpc:
                  record.labels[HttpAttribute.HTTP_METHOD] +
                  ' ' +
                  record.labels[HttpAttribute.HTTP_ROUTE],
                exception: record.labels['exception'],
                quantile: String(it),
              },
              aggregator: {
                toPoint: () => {
                  return {
                    timestamp: point.timestamp,
                    value: summary.values[idx],
                  };
                },
                update: () => {},
              },
            };
          })
        );
      }

      return result;
    },
  };

  translate(records: MetricRecord[]): MetricRecord[] {
    return records
      .map(record => {
        const translator = this.map[record.descriptor.name];
        if (translator) {
          return translator(record);
        }
        if (SystemMetric.LOAD_1MIN === record.descriptor.name) {
          return {
            ...record,
            descriptor: {
              ...record.descriptor,
              name: 'arms_system_load',
            },
            labels: {},
          };
        }
        if (SystemMetricNames.includes(record.descriptor.name)) {
          return {
            ...record,
            descriptor: {
              ...record.descriptor,
              name: 'arms_' + record.descriptor.name.replace('.', '_'),
            },
            labels: {},
          };
        }
        return undefined;
      })
      .filter(it => it !== undefined)
      .reduce<MetricRecord[]>((accu, it) => accu.concat(it), []);
  }
}

export function isSummaryValueType(value: unknown): value is SummaryPointValue {
  return (
    Array.isArray((value as SummaryPointValue).percentiles) &&
    Array.isArray((value as SummaryPointValue).values)
  );
}
