const base = require('./jest.config');

module.exports = {
  ...base, testRegex: String.raw`.*\.int-spec\.ts$`,
  coverageDirectory: './coverage-integration'
};
