'use strict';
const assert = require('assert');
const BluebirdPatcher = require('../../../src/patch/bluebird');
const bluebirdPatcher = new BluebirdPatcher();
const TraceManager = require('pandora-metrics').TraceManager;

run(function(done) {
  bluebirdPatcher.run();

  const Promise = require('bluebird');

  const traceManager = new TraceManager();

  function runInner() {
    const tracer = traceManager.create({
      traceId: '123456'
    });

    const parent = tracer.startSpan('parent');

    new Promise(function(resolve, reject) {
      const ct = traceManager.getCurrentTracer();
      ct.startSpan('inPromise');
      assert(ct.spans.length === 2);

      resolve(Math.floor(Math.random() * 10));
    }).then((data) => {
      const ct = traceManager.getCurrentTracer();
      const cs = ct.getCurrentSpan();

      ct.startSpan(`then-${data}`, {
        childOf: cs
      });
    }).then(() => {
      const spans = tracer.spans;
      assert(spans.length === 3);

      const parent = spans[1];
      const child = spans[2];

      assert(parent.context().spanId === child.context().parentId);
      done();
    });
  }

  traceManager.run(runInner);
});
