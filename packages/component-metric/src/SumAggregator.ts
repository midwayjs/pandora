import { Aggregator, Point } from '@opentelemetry/metrics';
import { HrTime } from '@opentelemetry/api';
import { hrTime } from '@opentelemetry/core';

/** Basic aggregator which calculates a Sum from individual measurements. */
export class SumAggregator implements Aggregator {
  private _current = 0;
  private _lastUpdateTime: HrTime = [0, 0];

  update(value: number): void {
    this._current += value;
    this._lastUpdateTime = hrTime();
  }

  toPoint(): Point {
    return {
      value: this._current,
      timestamp: this._lastUpdateTime,
    };
  }
}
