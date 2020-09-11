/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { HrTime } from '@opentelemetry/api';
import { hrTime } from '@opentelemetry/core';
import { Aggregator, Distribution, Point } from '@opentelemetry/metrics';

/**
 * Basic aggregator keeping all raw values (events, sum, max, last and min).
 */
export class MinMaxLastSumCountAggregator implements Aggregator {
  private _distribution: Distribution;
  private _lastUpdateTime: HrTime = [0, 0];

  constructor() {
    this._distribution = {
      min: Infinity,
      max: -Infinity,
      last: 0,
      sum: 0,
      count: 0,
    };
  }

  update(value: number): void {
    this._distribution.count++;
    this._distribution.sum += value;
    this._distribution.last = value;
    this._distribution.min = Math.min(this._distribution.min, value);
    this._distribution.max = Math.max(this._distribution.max, value);
    this._lastUpdateTime = hrTime();
  }

  toPoint(): Point {
    return {
      value: this._distribution,
      timestamp: this._lastUpdateTime,
    };
  }
}

export function isDistributionValueType(value: unknown): value is Distribution {
  return (
    typeof value === 'object' &&
    typeof (value as Distribution).max === 'number' &&
    typeof (value as Distribution).min === 'number'
  );
}
