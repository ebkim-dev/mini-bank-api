module.exports = {
  preset: 'ts-jest',
  setupFiles: ["<rootDir>/jest.setup.ts"],
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/src/**/*.test.ts',
  ],
};
