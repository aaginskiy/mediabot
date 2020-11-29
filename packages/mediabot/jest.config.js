module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      diagnostics: false,
      tsconfig: 'tsconfig.test.json'
    },
  },
  moduleNameMapper: {
    '@/(.*)': [
      '<rootDir>/src/$1'
    ],
  },
  watchman: false,
  setupFilesAfterEnv: ['jest-extended', '@relmify/jest-fp-ts'],
  coverageReporters: ['text-summary', 'lcov', 'html'],
  coveragePathIgnorePatterns: ['/node_modules/', 'src/logger.ts', 'src/channels.ts', 'lib/'],
  testPathIgnorePattern: ["/node_modules/", "/lib/"]
}
