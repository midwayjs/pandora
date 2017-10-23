import {AbstractSnapshot} from './AbstractSnapshot';
import {WeightSample} from '../domain';

/**
 * A statistical snapshot of a {@link WeightedSnapshot}.
 */
export class WeightedSnapshot extends AbstractSnapshot {

  values;
  normWeights = [];
  quantiles = [];

  constructor(values: Array<WeightSample>) {
    super();
    this.values = values.sort();

    let sumWeight = 0;
    for (let sample of this.values) {
      sumWeight += sample.weight;
    }

    for (let i = 0; i < this.values.length; i++) {
      this.values[i] = this.values[i].value;
      this.normWeights[i] = this.values[i].weight / sumWeight;
    }

    for (let i = 1; i < this.values.length; i++) {
      this.quantiles[i] = this.quantiles[i - 1] + this.normWeights[i - 1];
    }
  }

  /**
   * Returns the value at the given quantile.
   *
   * @param quantile a given quantile, in {@code [0..1]}
   * @return the value in the distribution at {@code quantile}
   */
  getValue(quantile: number) {
    if (quantile < 0.0 || quantile > 1.0 || isNaN(quantile)) {
      throw new Error(quantile + ' is not in [0..1]');
    }

    if (this.values.length === 0) {
      return 0.0;
    }

    let posx = this.quantiles.indexOf(quantile);
    if (posx < 0) {
      posx = ((-posx) - 1) - 1;
    }

    if (posx < 1) {
      return this.values[0];
    }

    if (posx >= this.values.length) {
      return this.values[this.values.length - 1];
    }

    return this.values[posx];
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
   * Returns the number of values in the snapshot.
   *
   * @return the number of values
   */
  size(): number {
    return this.values.length;
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
   * Returns the weighted arithmetic mean of the values in the snapshot.
   *
   * @return the weighted arithmetic mean
   */
  getMean(): number {
    if (this.values.length === 0) {
      return 0;
    }

    let sum = 0;
    for (let i = 0; i < this.values.length; i++) {
      sum += this.values[i] * this.normWeights[i];
    }
    return sum;
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
    let variance = 0;

    for (let i = 0; i < this.values.length; i++) {
      let diff = this.values[i] - mean;
      variance += this.normWeights[i] * diff * diff;
    }

    return Math.sqrt(variance);
  }

}
