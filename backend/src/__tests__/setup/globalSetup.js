/**
 * Jest Global Setup
 * Runs once before all test suites
 */
module.exports = async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.JWT_EXPIRATION = '1h';
  process.env.JWT_REFRESH_EXPIRATION = '7d';

  console.log('\n🚀 Setting up test environment...\n');
};
