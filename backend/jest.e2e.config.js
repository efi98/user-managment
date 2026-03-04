const base = require('./jest.base.config');

module.exports = {
  ...base,
  displayName: 'e2e',
  testRegex: String.raw`.*\.e2e-spec\.ts$`,
  coverageDirectory: './coverage-e2e',
  maxWorkers: 1,
};