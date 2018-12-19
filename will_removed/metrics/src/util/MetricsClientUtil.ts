const assert = require('assert');

export class MetricsClientUtil {

  private static client;

  static getMetricsClient() {
    if(!this.client) {
      assert('please set metrics client before use it');
    }
    return this.client;
  }

  static setMetricsClient(client) {
    this.client = client;
  }
}
