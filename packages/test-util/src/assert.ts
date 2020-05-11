import * as assert from 'assert';

export function deepMatch(
  actual: unknown,
  expected: unknown,
  message?: string
) {
  if (typeof expected !== 'object' || expected === null) {
    return assert.strictEqual(actual, expected, message);
  }
  assert(typeof actual === 'object');
  for (const [key, val] of Object.entries(expected)) {
    deepMatch(actual[key], val, message);
  }
}
