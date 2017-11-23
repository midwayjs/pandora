'use strict';

const xorshift = require('xorshift');

export function generateTraceId() {
  let randint = xorshift.randomint();
  let buf = new Buffer(8);
  buf.writeUInt32BE(randint[0], 0);
  buf.writeUInt32BE(randint[1], 4);

  return buf.toString('hex');
}
