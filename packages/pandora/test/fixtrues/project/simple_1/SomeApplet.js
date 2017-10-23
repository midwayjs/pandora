module.exports = class SomeApplet {
  constructor() {
    this.status = 'nil';
  }
  start() {
    this.status = 'start';
  }
  stop() {
    this.status = 'stop';
  }
  passTestCase() {
    return this.status;
  }
};
