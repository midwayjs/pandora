class Service {
  constructor() {
    this.math = Math;
  }

  handleSubscribe(reg, fn) {
    console.log(reg, fn);
  }

  handleUnsubscribe(reg, fn) {
    console.log(reg, fn);
  }

  abs(number) {
    this.core.getDependency('xxxService');
    return this.math.abs(number);
  }

  static getProxy() {
    return ServiceProxy;
  };
}

Service.dependencies = ['service1'];

class ServiceProxy {
  abs(number) {
    return this.core.invok('abs', [number]);
  }
}

module.exports = Service;
