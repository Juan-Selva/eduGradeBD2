/**
 * Test Server Configuration
 * Creates Express app for integration testing
 */
const express = require('express');
const cors = require('cors');

// Import middleware
const { errorHandler, notFoundHandler } = require('../../middlewares/errorHandler');

/**
 * Create test Express application
 */
const createTestApp = () => {
  const app = express();

  // Body parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS
  app.use(cors());

  return app;
};

/**
 * Configure routes on app
 */
const configureRoutes = (app, routes) => {
  Object.entries(routes).forEach(([path, router]) => {
    app.use(path, router);
  });

  // Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

/**
 * Create mock request object
 */
const mockRequest = (options = {}) => {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    user: options.user || null,
    userId: options.userId || null,
    ...options
  };
};

/**
 * Create mock response object
 */
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Create mock next function
 */
const mockNext = () => jest.fn();

module.exports = {
  createTestApp,
  configureRoutes,
  mockRequest,
  mockResponse,
  mockNext
};
