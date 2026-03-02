const base = require('./jest.config');

module.exports = {
  ...base, testRegex: String.raw`.*\.e2e-spec\.ts$`,
  coverageDirectory: './coverage-e2e',
  maxWorkers: 1
};
