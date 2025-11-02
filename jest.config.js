module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  setupFiles: ["./jest.setup.js"],
  collectCoverageFrom: [
    "lib/**/*.{ts,tsx}",
    "utils/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/*.test.{ts,tsx}",
    "!utils/import/**",
  ],
  coverageThreshold: {
    global: {
      branches: 15,
      functions: 8,
      lines: 15,
      statements: 15,
    },
  },
  coverageReporters: ["text", "lcov", "html"],
};
