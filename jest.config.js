module.exports = {
  preset: 'ts-jest',
  setupFiles: ["<rootDir>/jest.setup.ts"],
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.ts',
  ],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/config/**",
    "!src/generated/**",
    "!src/lifecycle.ts",
    "!src/start.ts",
    "!src/redis/redisDemoScript.ts",
  ]
};
