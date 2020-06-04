'use strict';
const constant = require('../../lib/constant');

module.exports = {
  get pandora() {
    return this.app.pandora;
  },
  get traceId() {
    const span = this[constant.span];
    if (span == null) {
      return undefined;
    }
    return span.spanContext.traceId;
  },
};
