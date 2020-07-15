'use strict';
const { constant } = require('@pandorajs/component-instrument-egg');

module.exports = {
  get pandora() {
    return this.app.pandora;
  },
  get traceId() {
    const span = this[constant.spanSymbol];
    if (span == null) {
      return undefined;
    }
    return span.spanContext.traceId;
  },
};
