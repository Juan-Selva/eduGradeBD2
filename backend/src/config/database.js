const mongoose = require('mongoose');
const neo4j = require('neo4j-driver');
const cassandra = require('cassandra-driver');
const Redis = require('ioredis');
const logger = require('../utils/logger');

// ============================================
// MongoDB Connection - Registro Academico
// ============================================
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      readPreference: 'secondaryPreferred',
    });
    logger.info('MongoDB conectado exitosamente');
  } catch (error) {
    logger.error('Error conectando a MongoDB:', error.message);
    throw error;
  }
};

// ============================================
// Neo4j Connection - Relaciones Academicas
// ============================================
let neo4jDriver = null;

const connectNeo4j = async () => {
  try {
    neo4jDriver = neo4j.driver(
      process.env.NEO4J_URI,
      neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD),
      {
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 30000,
      }
    );

    // Verificar conexion
    const session = neo4jDriver.session();
    await session.run('RETURN 1');
    await session.close();

    logger.info('Neo4j conectado exitosamente');
  } catch (error) {
    logger.error('Error conectando a Neo4j:', error.message);
    throw error;
  }
};

const getNeo4jSession = () => {
  if (!neo4jDriver) {
    throw new Error('Neo4j no esta conectado');
  }
  return neo4jDriver.session();
};

// ============================================
// Cassandra Connection - Analitica/Auditoria
// ============================================
let cassandraClient = null;

const initCassandraSchema = async (client) => {
  // Crear keyspace si no existe
  const createKeyspace = `
    CREATE KEYSPACE IF NOT EXISTS ${process.env.CASSANDRA_KEYSPACE}
    WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 3}
  `;
  await client.execute(createKeyspace);

  // Usar el keyspace
  await client.execute(`USE ${process.env.CASSANDRA_KEYSPACE}`);

  // Crear tabla de eventos de auditoria
  const createEventosTable = `
    CREATE TABLE IF NOT EXISTS eventos_auditoria (
      evento_id UUID,
      tipo_evento TEXT,
      entidad TEXT,
      entidad_id TEXT,
      usuario_id TEXT,
      datos TEXT,
      ip TEXT,
      timestamp TIMESTAMP,
      anio INT,
      mes INT,
      PRIMARY KEY ((anio, mes), timestamp, evento_id)
    ) WITH CLUSTERING ORDER BY (timestamp DESC, evento_id ASC)
  `;
  await client.execute(createEventosTable);

  // Crear indices secundarios
  try {
    await client.execute('CREATE INDEX IF NOT EXISTS idx_tipo_evento ON eventos_auditoria (tipo_evento)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_entidad ON eventos_auditoria (entidad)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_usuario ON eventos_auditoria (usuario_id)');
  } catch (e) {
    // Indices pueden ya existir
    logger.debug('Indices de Cassandra ya existen o no se pudieron crear');
  }

  logger.info('Schema de Cassandra inicializado correctamente');
};

const connectCassandra = async () => {
  try {
    // Primero conectar sin keyspace para poder crearlo
    const initClient = new cassandra.Client({
      contactPoints: process.env.CASSANDRA_CONTACT_POINTS.split(','),
      localDataCenter: process.env.CASSANDRA_LOCAL_DC,
      pooling: {
        coreConnectionsPerHost: {
          [cassandra.types.distance.local]: 2,
          [cassandra.types.distance.remote]: 1
        }
      }
    });

    await initClient.connect();
    logger.info('Cassandra conectado, inicializando schema...');

    // Inicializar schema
    await initCassandraSchema(initClient);
    await initClient.shutdown();

    // Ahora conectar con el keyspace
    cassandraClient = new cassandra.Client({
      contactPoints: process.env.CASSANDRA_CONTACT_POINTS.split(','),
      localDataCenter: process.env.CASSANDRA_LOCAL_DC,
      keyspace: process.env.CASSANDRA_KEYSPACE,
      pooling: {
        coreConnectionsPerHost: {
          [cassandra.types.distance.local]: 2,
          [cassandra.types.distance.remote]: 1
        }
      }
    });

    await cassandraClient.connect();
    logger.info('Cassandra conectado exitosamente con keyspace');
  } catch (error) {
    logger.error('Error conectando a Cassandra:', error.message);
    // Cassandra puede tardar mas en estar lista, reintentamos
    logger.info('Reintentando conexion a Cassandra en 10 segundos...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    return connectCassandra();
  }
};

const getCassandraClient = () => {
  if (!cassandraClient) {
    throw new Error('Cassandra no esta conectado');
  }
  return cassandraClient;
};

// ============================================
// Redis Connection - Cache de Reglas
// ============================================
let redisClient = null;

const connectRedis = async () => {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });

    redisClient.on('error', (err) => {
      logger.error('Error en Redis:', err.message);
    });

    redisClient.on('connect', () => {
      logger.info('Redis conectado exitosamente');
    });

    await redisClient.ping();
  } catch (error) {
    logger.error('Error conectando a Redis:', error.message);
    throw error;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis no esta conectado');
  }
  return redisClient;
};

// ============================================
// Conectar todas las bases de datos
// ============================================
const connectAllDatabases = async () => {
  await Promise.all([
    connectMongoDB(),
    connectNeo4j(),
    connectRedis(),
  ]);

  // Cassandra tarda mas, la conectamos despues
  await connectCassandra();

  logger.info('Todas las bases de datos conectadas');

  // Start periodic DB health checks for Prometheus
  _startHealthChecks();
};

// ============================================
// Health check periodico para metricas
// ============================================
let healthInterval = null;

const _startHealthChecks = () => {
  let metrics;
  try { metrics = require('../middlewares/metrics'); } catch (e) { return; }

  const setHealth = (database, value) => {
    metrics.safeSet(metrics.dbConnectionHealth, { database }, value);
  };

  const check = async () => {
    // MongoDB
    setHealth('mongodb', mongoose.connection.readyState === 1 ? 1 : 0);

    // Neo4j
    try {
      if (neo4jDriver) {
        const s = neo4jDriver.session();
        await s.run('RETURN 1');
        await s.close();
        setHealth('neo4j', 1);
      } else {
        setHealth('neo4j', 0);
      }
    } catch (e) { setHealth('neo4j', 0); }

    // Cassandra
    try {
      if (cassandraClient) {
        await cassandraClient.execute('SELECT now() FROM system.local');
        setHealth('cassandra', 1);
      } else {
        setHealth('cassandra', 0);
      }
    } catch (e) { setHealth('cassandra', 0); }

    // Redis
    try {
      if (redisClient) {
        await redisClient.ping();
        setHealth('redis', 1);
      } else {
        setHealth('redis', 0);
      }
    } catch (e) { setHealth('redis', 0); }
  };

  check();
  healthInterval = setInterval(check, 30000);
};

// ============================================
// Cerrar conexiones
// ============================================
const closeAllConnections = async () => {
  try {
    await mongoose.connection.close();
    if (neo4jDriver) await neo4jDriver.close();
    if (cassandraClient) await cassandraClient.shutdown();
    if (redisClient) await redisClient.quit();
    logger.info('Todas las conexiones cerradas');
  } catch (error) {
    logger.error('Error cerrando conexiones:', error.message);
  }
};

module.exports = {
  connectMongoDB,
  connectNeo4j,
  getNeo4jSession,
  connectCassandra,
  getCassandraClient,
  connectRedis,
  getRedisClient,
  connectAllDatabases,
  closeAllConnections,
};
