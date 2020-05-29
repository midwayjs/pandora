'use strict';
const constant = require('../../lib/constant');

module.exports = {
  get pandora() {
    return this.app.pandora;
  },
  get traceId() {
    return this[constant.span]?.spanContext.traceId;
  },
};
