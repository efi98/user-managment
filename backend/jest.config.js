module.exports = {
    testEnvironment: "node",
    coverageDirectory: "<rootDir>/.jest/coverage",
    testPathIgnorePatterns: [
        "/node_modules/",
        "/__tests__/test-utils/",
    ],
    collectCoverageFrom: [
        "routes/**/*.js",
        "middleware/**/*.js",
        "helpers/**/*.js",
        "!**/node_modules/**",
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 75,
            statements: 75,
        },
    }
};
