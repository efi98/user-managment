const base = require('./jest.base.config');

module.exports = {
  ...base,
  displayName: 'unit',
  testRegex: String.raw`.*\.spec\.ts$`,
  coverageDirectory: './coverage-unit',
};