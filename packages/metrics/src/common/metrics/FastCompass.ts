import { MetricType } from '../MetricType';
import { Metric } from '../domain';
import { BucketCounter } from './BucketCounter';

export interface IFastCompass extends Metric {

  /**
   * 记录一次方法调用的RT和子类别，子类别应当是正交的，不能有重叠
   * 例如 成功/失败
   * record a method invocation with execution time and sub-categories
   * @param duration must be milliseconds
   * @param subCategory all the sub-categories should be orthogonal,
   *                    which will be added up to the total number of method invocations
   */
  record(duration, subCategory);


  /**
   * 对于每个子类别，返回每个统计间隔的方法调用总次数
   * return method count per bucket per category
   * @return
   */
  getMethodCountPerCategory(startTime?): Map<string, Map<number, number>>;


  /**
   * 对于每个子类别，返回每个统计间隔的执行总时间和次数，按位分离操作放到下一层进行
   * return method execution time and count per bucket per category
   * @return
   */
  getMethodRtPerCategory(startTime?): Map<string, Map<number, number>>;

  /**
   * 对于每个子类别，返回每个统计间隔的执行总时间和次数，按位分离操作放到下一层进行
   * return method execution time and count per bucket per category
   * @return
   */
  getCountAndRtPerCategory(startTime): Map<string, Map<number, number>>;

  /**
   * 获取统计间隔
   * @return the bucket interval
   */
  getBucketInterval();
}


/**
 * 控制总次数的bit数, 理论统计上限为 2 ^ (64 -38 -1) = 33554432
 * This magic number divide a long into two parts,
 * where the higher part is used to record the total number of method invocations,
 * and the lower part is used to record the total method execution time.
 * The max number of count per collecting interval will be 2 ^ (64 -38 -1) = 33554432
 */
const COUNT_OFFSET = 38;

/**
 * 次数统计的累加基数，和rt相加得到实际更新到LongAdder的数
 * The base number of count that is added to total rt,
 * to derive a number which will be added to {@link LongAdder}
 */
const COUNT_BASE = 1 << 38;

/**
 * 总数和此数进行二进制与得到总rt统计
 * The base number is used to do BITWISE AND operation with the value of {@link LongAdder}
 * to derive the total number of execution time
 */
const RT_BITWISE_AND_BASE = (1 << 38) - 1;

const MAX_SUBCATEGORY_SIZE = 20;

const DEFAULT_BUCKET_COUNT = 10;


/**
 * 通过1个LongAdder来同时完成count和rt的累加操作
 * Java里面1个Long有64个bit, 除去最高位表示符号的1个bit，还有63个bit可以使用
 * 在一个不超过60s统计周期内，方法调用的总次数和总次数其实完全用不到63个bit
 * 所以可以将这两个统计项放到一个long里面来表示
 * 这里高位的25个bit表示统计周期内调用总次数，后38位表示总rt
 */
export class BaseFastCompass implements IFastCompass {
  type = MetricType.FASTCOMPASS;

  bucketInterval;
  numberOfBuckets;
  maxCategoryCount;
  subCategories: Map<string, BucketCounter>;

  constructor(bucketInterval, numberOfBuckets = DEFAULT_BUCKET_COUNT, maxCategoryCount = MAX_SUBCATEGORY_SIZE) {
    this.bucketInterval = bucketInterval;
    this.numberOfBuckets = numberOfBuckets;
    this.maxCategoryCount = maxCategoryCount;
    this.subCategories = new Map();
  }


  record(duration: number, subCategory: string) {
    if (duration < 0 || subCategory == null) {
      return;
    }
    if (!this.subCategories.has(subCategory)) {
      if (this.subCategories.size >= this.maxCategoryCount) {
        // ignore if maxCategoryCount is exceeded, no exception will be thrown
        return;
      }
      this.subCategories.set(subCategory, new BucketCounter(this.bucketInterval, this.numberOfBuckets, false));
    }
    let data = COUNT_BASE + duration;
    this.subCategories.get(subCategory).update(data);
  }

  getMethodCountPerCategory(startTime = 0): Map<string, Map<number, number>> {
    let countPerCategory: Map<string, Map<number, number>> = new Map();
    for (let [ key, value ] of this.subCategories.entries()) {
      let bucketCount: Map<number, number> = new Map();
      for (let [ innerKey, innerValue ] of value.getBucketCounts(startTime).entries()) {
        bucketCount.set(innerKey, innerValue >> COUNT_OFFSET);
      }
      countPerCategory.set(key, bucketCount);
    }
    return countPerCategory;
  }

  getMethodRtPerCategory(startTime = 0) {
    let rtPerCategory: Map<string, Map<number, number>> = new Map();
    for (let [ key, value ] of this.subCategories.entries()) {
      let bucketCount: Map<number, number> = new Map();
      for (let [ innerKey, innerValue ] of value.getBucketCounts(startTime).entries()) {
        bucketCount.set(innerKey, innerValue & RT_BITWISE_AND_BASE);
      }
      rtPerCategory.set(key, bucketCount);
    }

    return rtPerCategory;
  }

  getBucketInterval() {
    return this.bucketInterval;
  }

  getCountAndRtPerCategory(startTime = 0) {
    let countAndRtPerCategory: Map<string, Map<number, number>> = new Map();
    for (let [ key, value ] of this.subCategories.entries()) {
      let bucketCount: Map<number, number> = new Map();
      for (let [ innerKey, innerValue ] of value.getBucketCounts(startTime).entries()) {
        bucketCount.set(innerKey, innerValue);
      }
      countAndRtPerCategory.set(key, bucketCount);
    }
    return countAndRtPerCategory;
  }
}
