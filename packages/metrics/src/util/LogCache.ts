import {EventEmitter} from 'events';
const defaultCapacity = 100;

export class LogCache extends EventEmitter {

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
    by: 'size' | 'time',
    value: number,
    order?: 'ASC' | 'DESC'
  } = {
    by: 'size',
    value: 0,
  }) {
    let results;

    if (options.by === 'size') {
      if (options.value && options.value > 0 && options.value < this.capacity) {
        results = this.innerCache.slice(-1 * options.value);
      }
    }

    if (options.by === 'time') {
      if (options.value && options.value > 0) {
        results = this.innerCache.filter((data) => {
          if (data.date) {
            return data.date >= options.value;
          }

          return true;
        });
      }
    }

    if (!results) {
      results = this.innerCache.slice();
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
