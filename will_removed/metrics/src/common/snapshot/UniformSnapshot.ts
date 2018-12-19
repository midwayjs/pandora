import {AbstractSnapshot} from './AbstractSnapshot';

export class UniformSnapshot extends AbstractSnapshot {

  values;

  constructor(values) {
    super();
    this.values = values.sort();
  }

  getValue(quantile: number): number {
    if (quantile < 0.0 || quantile > 1.0 || isNaN(quantile)) {
      throw new Error(quantile + ' is not in [0..1]');
    }

    if (this.values.length === 0) {
      return 0.0;
    }

    const pos = quantile * (this.values.length + 1);
    const index = parseInt(<string><any>pos);

    if (index < 1) {
      return this.values[0];
    }

    if (index >= this.values.length) {
      return this.values[this.values.length - 1];
    }

    const lower = this.values[index - 1];
    const upper = this.values[index];
    return lower + (pos - Math.floor(pos)) * (upper - lower);
  }

  size(): number {
    return this.values.length;
  }


  /**
   * Returns the entire set of values in the snapshot.
   *
   * @return the entire set of values
   */
  getValues(): number[] {
    return this.values;
  }

  /**
   * Returns the highest value in the snapshot.
   *
   * @return the highest value
   */
  getMax(): number {
    if (this.values.length === 0) {
      return 0;
    }
    return this.values[this.values.length - 1];
  }

  /**
   * Returns the lowest value in the snapshot.
   *
   * @return the lowest value
   */
  getMin(): number {
    if (this.values.length === 0) {
      return 0;
    }
    return this.values[0];
  }

  /**
   * Returns the weighted arithmetic mean of the values in the snapshot.
   *
   * @return the weighted arithmetic mean
   */
  getMean(): number {
    if (this.values.length === 0) {
      return 0;
    }

    let sum = 0;
    for (let value of this.values) {
      sum += value;
    }
    return sum / this.values.length;
  }

  /**
   * Returns the weighted standard deviation of the values in the snapshot.
   *
   * @return the weighted standard deviation value
   */
  getStdDev(): number {
    // two-pass algorithm for variance, avoids numeric overflow

    if (this.values.length <= 1) {
      return 0;
    }

    let mean = this.getMean();
    let sum = 0;

    for (let value of this.values) {
      let diff = value - mean;
      sum += diff * diff;
    }

    const variance = sum / (this.values.length - 1);
    return Math.sqrt(variance);
  }
}
