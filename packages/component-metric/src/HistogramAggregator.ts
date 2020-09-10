import { Histogram, Point, Aggregator } from '@opentelemetry/metrics';
import { HrTime } from '@opentelemetry/api';
import { hrTime } from '@opentelemetry/core';

/**
 * Basic aggregator which observes events and counts them in pre-defined buckets
 * and provides the total sum and count of all observations.
 */
export class HistogramAggregator implements Aggregator {
  private _current: Histogram;
  private _lastUpdateTime: HrTime;
  private readonly _boundaries: number[];

  constructor(boundaries: number[]) {
    if (boundaries === undefined || boundaries.length === 0) {
      throw new Error('HistogramAggregator should be created with boundaries.');
    }
    // we need to an ordered set to be able to correctly compute count for each
    // boundary since we'll iterate on each in order.
    this._boundaries = boundaries.sort();
    this._current = this._newEmptyCheckpoint();
    this._lastUpdateTime = hrTime();
  }

  update(value: number): void {
    this._current.count += 1;
    this._current.sum += value;

    for (let i = 0; i < this._boundaries.length; i++) {
      if (value < this._boundaries[i]) {
        this._current.buckets.counts[i] += 1;
        return;
      }
    }

    // value is above all observed boundaries
    this._current.buckets.counts[this._boundaries.length] += 1;
  }

  toPoint(): Point {
    return {
      value: this._current,
      timestamp: this._lastUpdateTime,
    };
  }

  private _newEmptyCheckpoint(): Histogram {
    return {
      buckets: {
        boundaries: this._boundaries,
        counts: this._boundaries.map(() => 0).concat([0]),
      },
      sum: 0,
      count: 0,
    };
  }
}

export function isHistogramValueType(value: unknown): value is Histogram {
  return (
    typeof (value as Histogram).buckets === 'object' &&
    Array.isArray((value as Histogram).buckets.boundaries) &&
    Array.isArray((value as Histogram).buckets.counts)
  );
}
