const client = require('prom-client');

// Create a Registry
const register = new client.Registry();

// Add default metrics (GC, memory, etc.)
client.collectDefaultMetrics({ register });

// ============================================
// HTTP Metrics
// ============================================
const httpRequestDuration = new client.Histogram({
  name: 'edugrade_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register]
});

const httpRequestsTotal = new client.Counter({
  name: 'edugrade_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// ============================================
// Business Metrics
// ============================================
const conversionesTotal = new client.Counter({
  name: 'edugrade_conversiones_total',
  help: 'Total grade conversions performed',
  labelNames: ['sistema_origen', 'sistema_destino'],
  registers: [register]
});

const transferenciasTotal = new client.Counter({
  name: 'edugrade_transferencias_total',
  help: 'Total student transfers processed',
  labelNames: ['sistema_origen', 'sistema_destino', 'status'],
  registers: [register]
});

const calificacionesRegistradas = new client.Counter({
  name: 'edugrade_calificaciones_registradas_total',
  help: 'Total grades registered',
  labelNames: ['sistema', 'tipo_evaluacion'],
  registers: [register]
});

// ============================================
// DB Health Metrics
// ============================================
const dbConnectionHealth = new client.Gauge({
  name: 'edugrade_db_connection_health',
  help: 'Database connection health (1=up, 0=down)',
  labelNames: ['database'],
  registers: [register]
});

// ============================================
// Cache Metrics
// ============================================
const cacheHitsTotal = new client.Counter({
  name: 'edugrade_cache_hits_total',
  help: 'Total Redis cache hits',
  registers: [register]
});

const cacheMissesTotal = new client.Counter({
  name: 'edugrade_cache_misses_total',
  help: 'Total Redis cache misses',
  registers: [register]
});

// ============================================
// Rate Limit Metrics
// ============================================
const rateLimitHitsTotal = new client.Counter({
  name: 'edugrade_rate_limit_hits_total',
  help: 'Total rate limit rejections',
  labelNames: ['endpoint'],
  registers: [register]
});

// ============================================
// Error Metrics
// ============================================
const errorsTotal = new client.Counter({
  name: 'edugrade_errors_total',
  help: 'Total errors by type',
  labelNames: ['type', 'endpoint'],
  registers: [register]
});

// ============================================
// HTTP Metrics Middleware
// ============================================
const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationSec = durationNs / 1e9;

    // Normalize route to avoid high cardinality
    const route = req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : req.path;

    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode
    };

    httpRequestDuration.observe(labels, durationSec);
    httpRequestsTotal.inc(labels);
  });

  next();
};

/**
 * Safely increment a metric counter, silently ignoring errors.
 * This avoids the need for try/catch blocks at every call site.
 */
const safeInc = (counter, labels) => {
  try {
    counter.inc(labels);
  } catch (e) {
    // Metrics are non-critical; failures should not affect application flow
  }
};

/**
 * Safely set a gauge value, silently ignoring errors.
 */
const safeSet = (gauge, labels, value) => {
  try {
    gauge.set(labels, value);
  } catch (e) {
    // Metrics are non-critical; failures should not affect application flow
  }
};

module.exports = {
  register,
  metricsMiddleware,
  httpRequestDuration,
  httpRequestsTotal,
  conversionesTotal,
  transferenciasTotal,
  calificacionesRegistradas,
  dbConnectionHealth,
  cacheHitsTotal,
  cacheMissesTotal,
  rateLimitHitsTotal,
  errorsTotal,
  safeInc,
  safeSet
};
