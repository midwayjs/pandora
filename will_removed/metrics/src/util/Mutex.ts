
export class Mutex {

  private locked = false;
  private waiting = [];
  private timer = null;

  /**
   * 尝试获取锁
   * @param {number} ttl - 超时时间
   * @returns {boolean}
   */
  tryLock(ttl?: number) {
    if (this.locked) {
      return false;
    }

    this.locked = true;

    if (ttl) {
      this.timer = setTimeout(() => {
        this.unlock();
      }, ttl);
    }
    return true;
  }

  lock(cb) {
    if (this.locked) {
      this.waiting.push(cb);
    } else {
      this.locked = true;
      cb.call(this);
    }
  }

  wait(cb) {
    this.waiting.push(cb);
  }

  unlock() {
    if (!this.locked) {
      return;
    }

    this.locked = false;

    if (this.timer) {
      clearTimeout(this.timer);
    }

    if (this.waitingCount > 0) {
      let waiter;
      while ((waiter = this.waiting.shift()) && typeof waiter === 'function') {
        waiter.call(this);
      }

    }
  }

  get waitingCount() {
    return this.waiting.length;
  }
}
