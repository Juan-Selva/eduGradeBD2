/**
 * Jest Setup - Runs before each test file
 */

// Increase timeout for async operations (30s for MongoMemoryServer startup)
jest.setTimeout(30000);

// Suppress console logs during tests (optional)
// Uncomment to enable silent mode
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRATION = '1h';
process.env.JWT_REFRESH_EXPIRATION = '7d';

// Global test utilities
global.testUtils = {
  /**
   * Generate a random string
   */
  randomString: (length = 10) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Generate a random email
   */
  randomEmail: () => {
    return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
  },

  /**
   * Wait for a specified time
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};
