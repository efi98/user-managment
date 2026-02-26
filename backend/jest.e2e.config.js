module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.e2e-spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.entity.ts',
    '!src/**/*.interface.ts',
  ],
  coverageDirectory: './coverage-e2e',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@auth/(.*)$': '<rootDir>/src/auth/$1',
    '^@users/(.*)$': '<rootDir>/src/users/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@assets/(.*)$': '<rootDir>/assets/$1',
    '^@consts$': '<rootDir>/src/common/consts.constants.ts',
    '^@errors$': '<rootDir>/src/common/errors.constants.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 75,
      statements: 75,
    },
  },
};
