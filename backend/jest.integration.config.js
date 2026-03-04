const base = require('./jest.base.config');

module.exports = {
  ...base,
  displayName: 'integration',
  testRegex: String.raw`.*\.int-spec\.ts$`,
  coverageDirectory: './coverage-integration',
  maxWorkers: 1,
};