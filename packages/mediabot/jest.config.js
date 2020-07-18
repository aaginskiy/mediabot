module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
  watchman: false,
  setupFilesAfterEnv: ['jest-extended'],
  coverageReporters: ['text-summary', 'lcov', 'html'],
}
