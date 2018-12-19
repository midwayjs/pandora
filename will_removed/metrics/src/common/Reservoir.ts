import {Snapshot} from './domain';

export enum ReservoirType {
  /**
   * The exponentially decaying reservoir
   */
  EXPONENTIALLY_DECAYING,
  /**
   * The sliding time window reservoir
   */
  SLIDING_TIME_WINDOW,
  /**
   * The sliding window reservoir
   */
  SLIDING_WINDOW,
  /**
   * The uniform reservoir
   */
  UNIFORM,
  /**
   * The bucket reservoir
   */
  BUCKET
}

/**
 * A statistically representative reservoir of a data stream.
 */
export interface IReservoir {
  /**
   * Returns the number of values recorded.
   *
   * @return the number of values recorded
   */
  size(): number;

  /**
   * Adds a new recorded value to the reservoir.
   *
   * @param value a new recorded value
   */
  update(value: number);

  /**
   * Returns a snapshot of the reservoir's values.
   *
   * @return a snapshot of the reservoir's values
   */
  getSnapshot(): Snapshot;
}

export abstract class Reservoir implements IReservoir {

  values: any = [];
  count = 0;

  update(value: number) {
    this.values.push(value);
  }

  clear() {
    this.values = [];
    this.count = 0;
  }

  size() {
    return this.values.length;
  }

  print() {
    console.log(this.values);
  }

  getValues() {
    return this.values;
  }

  abstract getSnapshot(): Snapshot;

}
