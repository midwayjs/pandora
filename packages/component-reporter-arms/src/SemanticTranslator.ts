import {
  RpcMetric,
  GeneralAttribute,
  SystemMetric,
  HttpAttribute,
} from '@pandorajs/semantic-conventions';
import { isSummaryValueType } from '@pandorajs/component-metric';
import { ArmsMetaStringRegistry } from './ArmsMetaStringRegistry';
import { Labels } from '@opentelemetry/api';
import { PlainMetricRecord } from './types';

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
      record: PlainMetricRecord
    ): PlainMetricRecord => {
      return {
        ...record,
        descriptor: {
          ...record.descriptor,
          name: `arms_${
            record.labels[GeneralAttribute.COMPONENT]
          }_requests_total`,
        },
        labels: this.extractCommonLabels(record.labels),
      };
    },
    [RpcMetric.REQUEST_COUNT]: (
      record: PlainMetricRecord
    ): PlainMetricRecord => {
      return {
        ...record,
        descriptor: {
          ...record.descriptor,
          name: `arms_${
            record.labels[GeneralAttribute.COMPONENT]
          }_requests_by_status_total`,
        },
        labels: {
          ...this.extractCommonLabels(record.labels),
          status: record.labels[HttpAttribute.HTTP_STATUS_CODE],
        },
      };
    },
    [RpcMetric.RESPONSE_ERROR_COUNT]: (
      record: PlainMetricRecord
    ): PlainMetricRecord => {
      return {
        ...record,
        descriptor: {
          ...record.descriptor,
          name: `arms_${
            record.labels[GeneralAttribute.COMPONENT]
          }_requests_error_total`,
        },
        labels: this.extractCommonLabels(record.labels),
      };
    },
    [RpcMetric.RESPONSE_DURATION]: (
      record: PlainMetricRecord
    ): PlainMetricRecord[] => {
      const labels = this.extractCommonLabels(record.labels);
      const point = record.point;
      let result: PlainMetricRecord[] = [
        {
          ...record,
          descriptor: {
            ...record.descriptor,
            name: `arms_${
              record.labels[GeneralAttribute.COMPONENT]
            }_requests_seconds_total`,
          },
          labels,
          point: {
            timestamp: point.timestamp,
            value:
              typeof point.value === 'number'
                ? point.value / 1000
                : point.value.sum / 1000,
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
                ...labels,
                quantile: String(it),
              },
              point: {
                timestamp: point.timestamp,
                value: summary.values[idx],
              },
            };
          })
        );
      }

      return result;
    },
  };

  constructor(private metaStringRegistry: ArmsMetaStringRegistry) {}

  translate(records: PlainMetricRecord[]): PlainMetricRecord[] {
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
      .reduce<PlainMetricRecord[]>((accu, it) => accu.concat(it), []);
  }

  private extractCommonLabels(labels: Labels): Labels {
    const result: Labels = {
      rpc:
        labels[HttpAttribute.HTTP_METHOD] +
        ' ' +
        labels[HttpAttribute.HTTP_ROUTE],
    };
    if (labels['exception']) {
      result['exception'] = labels['exception'];
    }
    if (labels['stacktrace']) {
      result['stackTraceId'] = this.metaStringRegistry.getMetaIdForString(
        labels['stacktrace']
      );
    }
    return result;
  }
}
