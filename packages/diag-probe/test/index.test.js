const binding = require('../lib');
const assert = require('assert');

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

describe('binding', () => {
  it('statistics values', () => {
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

    binding.teardown();
  });
});

function run() {
  const it = {};
  let idx = 0;
  while (idx < 40) {
    it[idx] = [];
    idx++;
  }
}
