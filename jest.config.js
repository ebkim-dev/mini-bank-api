// jest.config.js
module.exports = {
  preset: 'ts-jest',         // crucial for TS parsing
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'], // point to your test files
};
