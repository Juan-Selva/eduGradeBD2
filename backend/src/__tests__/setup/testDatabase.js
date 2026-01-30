/**
 * Test Database Configuration
 * Uses MongoDB Memory Server for isolated testing (local)
 * Uses real MongoDB when running in Docker (Alpine doesn't support MongoMemoryServer)
 */
const mongoose = require('mongoose');

let mongoServer;
let useRealMongo = false;

// Detect if running in Docker (Alpine Linux or MONGODB_URI set)
const isDocker = () => {
  return process.env.USE_REAL_MONGO === 'true' ||
         process.env.DOCKER_ENV === 'true';
};

/**
 * Connect to MongoDB (in-memory or real based on environment)
 */
const connect = async () => {
  if (isDocker()) {
    // Use real MongoDB in Docker (use test database to not affect real data)
    useRealMongo = true;
    const uri = process.env.MONGODB_TEST_URI || 'mongodb://admin:edugrade2024@mongodb:27017/edugrade_test?authSource=admin';

    await mongoose.connect(uri, {
      maxPoolSize: 10
    });

    console.log('[TestDB] Connected to real MongoDB (Docker mode)');
    return uri;
  } else {
    // Use MongoMemoryServer for local development
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri, {
      maxPoolSize: 10
    });

    console.log('[TestDB] Connected to MongoMemoryServer (local mode)');
    return uri;
  }
};

/**
 * Clear all collections
 */
const clearDatabase = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

/**
 * Drop database and close connection
 */
const closeDatabase = async () => {
  if (useRealMongo) {
    // In Docker mode, just clear collections (don't drop the whole database)
    await clearDatabase();
    await mongoose.connection.close();
  } else {
    // In local mode, drop the in-memory database
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();

    if (mongoServer) {
      await mongoServer.stop();
    }
  }
};

/**
 * Check if connected
 */
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = {
  connect,
  clearDatabase,
  closeDatabase,
  isConnected
};
