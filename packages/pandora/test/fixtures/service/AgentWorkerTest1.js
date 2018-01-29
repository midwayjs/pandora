const EventEmitter = require('events');

class AgentWorkerTest1 extends EventEmitter {
  constructor() {
    super();
    this.math = Math;
  }
  handleSubscribe(reg, fn) {
    this.on(reg, fn);
  }
  handleUnsubscribe(reg, fn) {
    this.removeListener(reg, fn);
  }
  abs(number) {
    return this.math.abs(number);
  }
  static getProxy() {
    return AgentWorkerTest1Proxy;
  };
  subscribe(reg, fn) {
    return this.context.subscribe(reg, fn);
  }
  unsubscribe(reg, fn) {
    return this.context.unsubscribe(reg, fn);
  }
}

class AgentWorkerTest1Proxy {
  abs(number) {
    return this.core.invoke('abs', [number]);
  }
  subscribe(reg, fn) {
    return this.core.subscribe(reg, fn);
  }
  unsubscribe(reg, fn) {
    return this.core.unsubscribe(reg, fn);
  }
}

module.exports = AgentWorkerTest1;
