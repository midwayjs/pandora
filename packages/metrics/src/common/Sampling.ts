import {Snapshot} from './snapshot/Snapshot';

/**
 * An object which samples values.
 */
export interface Sampling {
  /**
   * Returns a snapshot of the values.
   *
   * @return a snapshot of the values
   */
  getSnapshot(): Snapshot;
}
