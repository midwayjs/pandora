module.exports = class {
  constructor(options) {
    this.config = options.config;
  }
  start () {
    this.loop = setInterval(() => {
      console.log('Background loop');
    }, this.config.loopInterval);
    console.log('Background loop started, interval -> ' + this.config.loopInterval);
  }
  stop () {
    clearInterval(this.loop);
    console.log('Background loop stopped');
  }
};
console.log('gc() at backgroundTask.js', typeof gc);
