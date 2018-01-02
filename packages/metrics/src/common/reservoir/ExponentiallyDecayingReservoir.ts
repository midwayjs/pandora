import {Reservoir} from '../Reservoir';
import {BinaryHeap} from '../util/BinaryHeap';
import {WeightedSnapshot} from '../snapshot/WeightedSnapshot';
import {Constants} from '../Constants';
import {Snapshot} from '../domain';

const DEFAULT_SIZE: number = 1028;
const DEFAULT_ALPHA: number = 0.015;
/*
*  Take an exponentially decaying sample of size size of all values
*/
const RESCALE_THRESHOLD = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * An exponentially-decaying random reservoir of {@code long}s. Uses Cormode et al's
 * forward-decaying priority reservoir sampling method to produce a statistically representative
 * sampling reservoir, exponentially biased towards newer entries.
 *
 * @see <a href="http://dimacs.rutgers.edu/~graham/pubs/papers/fwddecay.pdf">
 * Cormode et al. Forward Decay: A Practical Time Decay Model for Streaming Systems. ICDE '09:
 *      Proceedings of the 2009 IEEE International Conference on Data Engineering (2009)</a>
 */
export class ExponentiallyDecayingReservoir extends Reservoir {

  values: BinaryHeap;
  alpha;
  limit;
  startTime;
  nextScaleTime;

  constructor(size: number = DEFAULT_SIZE, alpha: number = DEFAULT_ALPHA) {
    super();
    this.limit = size;
    this.alpha = alpha;
    this.clear();
  }

  update(val: number, timestamp?) {
    // Convert timestamp to seconds
    if (timestamp === undefined) {
      timestamp = this.tick();
    } else {
      timestamp = timestamp / 1000;
    }
    let priority = this.weight(timestamp - this.startTime) / Math.random();
    let value = {val, priority};

    if (this.count < this.limit) {
      this.count += 1;
      this.values.push(value);
    } else {
      let first = this.values.peek();
      if (first.priority < priority) {
        this.values.push(value);
        this.values.pop();
      }
    }

    if (this.now() > this.nextScaleTime) {
      this.rescale(this.now(), this.nextScaleTime);
    }
  }

  clear() {
    this.values = this.newHeap();
    this.count = 0;
    this.startTime = this.tick();
    this.nextScaleTime = this.now() + RESCALE_THRESHOLD;
  }

  size(): number {
    return this.values.size();
  }

  getValues() {
    let values = [],
      elt,
      heap = this.values.clone();

    while (elt = heap.pop()) {
      values.push(elt.val);
    }
    return values;
  }

  getSnapshot(): Snapshot {
    try {
      return new WeightedSnapshot(this.getValues());
    } catch (e) {
      return new InvalidSnapshot();
    }
  }

  private now() {
    return (new Date()).getTime();
  }

  private newHeap() {
    return new BinaryHeap(function (obj) {
      return obj.priority;
    });
  }

  private tick() {
    return this.now() / 1000;
  }

  private rescale(now, next) {
    this.nextScaleTime = this.now() + RESCALE_THRESHOLD;
    let oldContent = this.values.content,
      newContent = [],
      oldStartTime = this.startTime;

    this.startTime = (now && now / 1000) || this.tick();
    // Downscale every priority by the same factor. Order is unaffected, which is why we're avoiding the cost of popping.
    for (let i = 0; i < oldContent.length; i++) {
      newContent.push({
        val: oldContent[i].val,
        priority: oldContent[i].priority * Math.exp(-this.alpha * (this.startTime - oldStartTime))
      });
    }
    this.values.content = newContent;
  }

  private weight(time) {
    return Math.exp(this.alpha * time);
  }
}

class InvalidSnapshot implements Snapshot {

  data = [];

  getValue(quantile) {
    return Constants.NOT_AVAILABLE;
  }

  getValues() {
    return this.data;
  }

  size() {
    return 0;
  }

  getMedian() {
    return Constants.NOT_AVAILABLE;
  }

  get75thPercentile() {
    return Constants.NOT_AVAILABLE;
  }

  get95thPercentile() {
    return Constants.NOT_AVAILABLE;
  }

  get98thPercentile() {
    return Constants.NOT_AVAILABLE;
  }

  get99thPercentile() {
    return Constants.NOT_AVAILABLE;
  }

  get999thPercentile() {
    return Constants.NOT_AVAILABLE;
  }

  getMax() {
    return Constants.NOT_AVAILABLE;
  }

  getMean() {
    return Constants.NOT_AVAILABLE;
  }

  getMin() {
    return Constants.NOT_AVAILABLE;
  }

  getStdDev() {
    return Constants.NOT_AVAILABLE;
  }

}
