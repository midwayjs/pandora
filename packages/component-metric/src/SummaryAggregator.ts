import { Point, Aggregator } from '@opentelemetry/metrics';
import { HrTime } from '@opentelemetry/api';
import { hrTime } from '@opentelemetry/core';
import { TDigest } from 'tdigest';
import { SummaryPointValue } from './types';

export class SummaryAggregator implements Aggregator {
  _digest: TDigest;
  _last = 0;
  _sum = 0;
  _count = 0;
  _lastUpdate: HrTime = [0, 0];

  constructor(private percentiles: number[]) {
    this._digest = new TDigest();
  }

  update(value: number) {
    this._digest.push(value);
    this._last = value;
    this._sum += value;
    ++this._count;
    this._lastUpdate = hrTime();
  }

  toPoint(): Point {
    this._digest.compress();
    return {
      value: this.toDistribution(),
      timestamp: this._lastUpdate,
    };
  }

  private toDistribution(): SummaryPointValue {
    return {
      min: this._digest.percentile(0),
      max: this._digest.percentile(1),
      last: this._last,
      count: this._count,
      sum: this._sum,
      percentiles: this.percentiles,
      values: this.percentiles.map(p => this._digest.percentile(p)),
    };
  }
}

export function isSummaryValueType(value: unknown): value is SummaryPointValue {
  return (
    Array.isArray((value as SummaryPointValue).percentiles) &&
    Array.isArray((value as SummaryPointValue).values)
  );
}
