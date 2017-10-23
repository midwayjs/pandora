module.exports = class ConfigApplet {
  constructor(options) {
    this.options = options;
    this.status = 'nil';
  }
  start() {
    this.status = 'start';
  }
  stop() {
    this.status = 'stop';
  }
  getConfig() {
    return this.options.config;
  }
};
