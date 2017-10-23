/**
 * A metric name with the ability to include semantic tags.
 *
 * This replaces the previous style where metric names where strictly
 * dot-separated strings.
 *
 */
import {MetricLevel} from './MetricLevel';

const SEPARATOR = '.';

export class MetricName {
  key: string;
  tags: Object;
  level: MetricLevel;
  static EMPTY = new MetricName();
  static EMPTY_TAGS = {};
  static TAGS_SPLIT = '^&*';
  static NAME_JOIN = '@%^';
  static TAGS_JOIN = '!*&';
  static TAGS_CONCAT = '%^&';

  constructor(key: string = '', tags: Object = {}, level: MetricLevel = MetricLevel.NORMAL) {
    this.key = key;
    this.tags = tags;
    this.level = level;
  }

  getKey() {
    return this.key;
  }

  getTags() {
    return this.tags;
  }

  /**
   * Return the level of this metric
   * The level indicates the importance of the metric
   *
   * @return when level tag do not exist or illegal tag, will return null.
   */
  getMetricLevel() {
    return this.level;
  }

  /**
   * Metric level can be changed during runtime
   * @param level the level to set
   */
  setLevel(level: MetricLevel) {
    this.level = level;
    return this;
  }

  /**
   * Build a new metric name using the specific path components.
   *
   * @param parts Path of the new metric name.
   * @return A newly created metric name with the specified path.
   *
   */
  static build(...parts: string[]): MetricName {
    if (parts === null || parts.length === 0) {
      return MetricName.EMPTY;
    }

    if (parts.length === 1) {
      return new MetricName(parts[0]);
    }

    return new MetricName(MetricName.buildName(parts));
  }

  /**
   * Join the specified set of metric names.
   *
   * @param parts Multiple metric names to join using the separator.
   * @return A newly created metric name which has the name of the specified
   *         parts and includes all tags of all child metric names.
   */
  static join(...parts: MetricName[]): MetricName {
    let nameBuilder = [];
    let tags = {};

    let first = true;
    let firstName: MetricName = null;

    for (let part of parts) {
      let name = part.getKey();

      if (name) {
        if (first) {
          first = false;
          firstName = part;
        } else {
          nameBuilder.push(SEPARATOR);
        }

        nameBuilder.push(name);
      }

      if (Object.keys(part.getTags()).length) {
        Object.assign(tags, part.getTags());
      }
    }

    let level = firstName === null ? null : firstName.getMetricLevel();
    return new MetricName(nameBuilder.join(''), tags, MetricLevel[level]);
  }

  private static buildName(names: string[]) {
    return names.join(SEPARATOR);
  }

  /**
   * Build the MetricName that is this with another path appended to it.
   *
   * The new MetricName inherits the tags of this one.
   *
   * @param p The extra path element to add to the new metric.
   * @param inheritTags if true, tags will be inherited
   * @return A new metric name relative to the original by the path specified
   *         in p.
   */
  resolve(p: string, inheritTags: boolean = true): MetricName {
    let next;

    if (p) {
      if (this.key) {
        next = this.key + SEPARATOR + p;
      } else {
        next = p;
      }
    } else {
      next = this.key;
    }

    return inheritTags ? new MetricName(next, this.tags, this.level) : new MetricName(next, null, this.level);
  }

  /**
   * Same as {@link #tagged(Map)}, but takes a variadic list
   * of arguments.
   *
   * @see #tagged(Map)
   * @param pairs An even list of strings acting as key-value pairs.
   * @return A newly created metric name with the specified tags associated
   *         with it.
   */
  tagged(...pairs): MetricName {
    if (!pairs) {
      return this;
    }

    if(pairs.length === 1 && typeof pairs[0] === 'object') {
      let tags = pairs[0];
      Object.assign(tags, this.tags);
      return new MetricName(this.key, tags, this.level);
    }

    if (pairs.length % 2 !== 0) {
      throw new Error('Argument count must be even');
    }

    let add = {};

    for (let i = 0; i < pairs.length; i += 2) {
      add[pairs[i]] = pairs[i + 1];
    }

    return this.tagged(add);
  }

  getNameKey() {
    let tagsArr = [];

    for(let key in this.tags) {
      tagsArr.push(key + MetricName.TAGS_CONCAT + this.tags[key]);
    }

    tagsArr.sort();
    return [this.key, tagsArr.join(MetricName.TAGS_JOIN), this.level].join(MetricName.NAME_JOIN);
  }

  toString() {
    return this.getNameKey();
  }

  /**
   * 从字符串解析为对象
   * @param key
   */
  static parseKey(key: string): MetricName {
    let arrs: string[] = key.split(MetricName.NAME_JOIN);
    // 处理 tags
    if(arrs.length === 3) {
      let key = arrs[0];
      let tagArr = arrs[1].split(MetricName.TAGS_JOIN);
      let tags = {};

      for(let tagStr of tagArr) {
        if(tagStr) {
          let tagO = tagStr.split(MetricName.TAGS_CONCAT);
          tags[tagO[0]] = tagO[1];
        }
      }
      let level = MetricLevel[arrs[2]];

      return new MetricName(key, tags, level);
    } else if(arrs.length === 1) {
      let key = arrs[0];
      return new MetricName(key);
    } else if(arrs.length === 2) {
      let key = arrs[0];
      let tagArr = arrs[1].split(MetricName.TAGS_JOIN);
      let tags = {};
      for(let tagStr of tagArr) {
        let tagO = tagStr.split(MetricName.TAGS_CONCAT);
        tags[tagO[0]] = tagO[1];
      }
      return new MetricName(key, tags);
    }

    return MetricName.EMPTY;

  }
}
