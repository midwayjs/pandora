module.exports = {
  ...require('../../.mocharc.json'),
  require: ['ts-node/register', './test/TestHelper.ts'],
};
