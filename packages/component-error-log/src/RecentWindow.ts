export interface RecentWindowOptions {
  poolSize: number;
}

export class RecentWindow <T> {
  poolSize: number;
  pool: T[] = [];
  constructor(options: RecentWindowOptions) {
    this.poolSize = options.poolSize;
  }
  push(item: T) {
    if(this.pool.length >= this.poolSize) {
      this.pool.shift();
    }
    this.pool.push(item);
  }
  list() {
    return Array.from(this.pool);
  }
}