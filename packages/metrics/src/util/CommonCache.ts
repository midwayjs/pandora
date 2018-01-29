import {EventEmitter} from 'events';
const defaultCapacity = 100;

export class CommonCache extends EventEmitter {

  private innerCache = [];

  private capacity;

  constructor(capacity?: number) {
    super();

    this.capacity = capacity || defaultCapacity;

    this.on('add', () => {
      if (this.innerCache.length > this.capacity) {
        this.innerCache.shift();
      }
    });
  }

  push(item) {
    this.innerCache.push(item);
    this.emit('add');
  }

  /**
   * 支持两种行为，取最后几条数据以及取特定时间之后的数据
   * @param options
   * @returns {any}
   */
  query(options: {
    by?: 'size' | string,
    value?: number,
    order?: 'ASC' | 'DESC',
    offset?: number,
    limit?: number
  } = {
    by: 'size',
    value: 0,
  }) {
    let results;

    if (options.by && options.value && options.value > 0) {
      if (options.by === 'size') {
        if (options.value < this.capacity) {
          results = this.innerCache.slice(-1 * options.value);
        }
      } else {
        results = this.innerCache.filter((data) => {
          let value = data[options.by];

          if (value) {
            return value >= options.value;
          }
          return true;
        });
      }
    }

    if (!results) {
      results = this.innerCache.slice();
    }

    if (options.offset != null && options.limit != null) {
      const offset = options.offset;
      const limit = options.limit;
      results = this.innerCache.slice(offset, offset + limit);
    }

    if (options.order === 'DESC') {
      results.reverse();
    }

    return results;
  }

  clear() {
    this.innerCache.length = 0;
  }

  updateCapacity(newCapacity: number) {
    this.capacity = newCapacity;
  }

  getCapacity() {
    return this.capacity;
  }

  getSize() {
    return this.innerCache.length;
  }
}
