/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
  },
  setupFiles: ["<rootDir>/tests/jest.setup.ts"],
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  // Integration tests share one real (test) database — parallel workers would
  // race each other's lockout counters/rate limits. Run serially instead.
  maxWorkers: 1,
  testTimeout: 15000,
};
