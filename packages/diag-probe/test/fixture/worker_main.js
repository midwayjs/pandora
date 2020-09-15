// eslint-disable-next-line node/no-unsupported-features/node-builtins
const { isMainThread, parentPort } = require('worker_threads');
const assert = require('assert');
const binding = require('../../lib');

const gcTypes = [
  'total_gc',
  'scavenge',
  'mark_sweep_compact',
  'incremental_marking',
  'process_weak_callbacks',
];
const keys = gcTypes
  .map(it => [
    `${it}_times`,
    `${it}_duration`,
    `${it}_duration_max`,
    `${it}_duration_min`,
  ])
  .reduce((accu, it) => accu.concat(it), []);

function main() {
  binding.setup();
  let idx = 0;
  while (idx < 10) {
    run();
    idx++;
    global.gc();
    const statistics = binding.getStatistics();
    assert(typeof statistics === 'object');
    assert.deepStrictEqual(Object.keys(statistics).sort(), [...keys].sort());
    for (const key of keys) {
      assert(typeof statistics[key] === 'number');
    }
  }

  const stat = binding.getStatistics();
  binding.teardown();
  return stat;
}

function run() {
  const it = {};
  let idx = 0;
  while (idx < 40) {
    it[idx] = [];
    idx++;
  }
}

if (module === require.main) {
  const stat = main();
  if (!isMainThread) {
    parentPort.postMessage(stat);
  }
}
