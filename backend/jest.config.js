/**
 * Jest Configuration for EduGrade Global Backend
 */
module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Root directory
  rootDir: '.',

  // Test files location
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.js',
    '<rootDir>/src/**/*.test.js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/__tests__/**',
    '!src/scripts/**',
    '!src/index.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/jest.setup.js'],

  // Module paths
  moduleDirectories: ['node_modules', 'src'],

  // Test timeout (30 seconds for integration tests with MongoMemoryServer)
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Force exit after tests complete
  forceExit: true,

  // Clear mocks between tests
  clearMocks: true,

  // Reset mocks between tests
  resetMocks: true,

  // Detect open handles
  detectOpenHandles: true,

  // Test path ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/'
  ],

  // Transform ignore
  transformIgnorePatterns: [
    '/node_modules/'
  ],

  // Global setup/teardown
  globalSetup: '<rootDir>/src/__tests__/setup/globalSetup.js',
  globalTeardown: '<rootDir>/src/__tests__/setup/globalTeardown.js'
};
