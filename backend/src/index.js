require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const logger = require('./utils/logger');
const { connectAllDatabases, closeAllConnections } = require('./config/database');
const { errorHandler, notFoundHandler, generalLimiter } = require('./middlewares');

// Importar rutas
const estudianteRoutes = require('./routes/estudiante.routes');
const institucionRoutes = require('./routes/institucion.routes');
const materiaRoutes = require('./routes/materia.routes');
const calificacionRoutes = require('./routes/calificacion.routes');
const conversionRoutes = require('./routes/conversion.routes');
const trayectoriaRoutes = require('./routes/trayectoria.routes');
const reporteRoutes = require('./routes/reporte.routes');
const auditoriaRoutes = require('./routes/auditoria.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Configuracion Swagger
// ============================================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EduGrade Global API',
      version: '1.0.0',
      description: 'Sistema Nacional de Calificaciones Multimodelo - API REST',
      contact: {
        name: 'EduGrade Team'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido del endpoint /api/auth/login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'integer' }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'VALIDATION_ERROR' },
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        Usuario: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string' },
            nombre: { type: 'string' },
            apellido: { type: 'string' },
            rol: { type: 'string', enum: ['admin', 'docente', 'administrativo', 'consulta'] },
            permisos: { type: 'array', items: { type: 'string' } }
          }
        },
        Estudiante: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            dni: { type: 'string' },
            nombre: { type: 'string' },
            apellido: { type: 'string' },
            fechaNacimiento: { type: 'string', format: 'date' },
            paisOrigen: { type: 'string', enum: ['UK', 'US', 'DE', 'AR'] },
            email: { type: 'string' }
          }
        },
        Calificacion: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            estudianteId: { type: 'string' },
            materiaId: { type: 'string' },
            sistemaOrigen: { type: 'string', enum: ['UK', 'US', 'DE', 'AR'] },
            valorOriginal: { type: 'object' },
            tipoEvaluacion: { type: 'string' },
            fechaEvaluacion: { type: 'string', format: 'date' },
            hashIntegridad: { type: 'string' }
          }
        },
        Conversion: {
          type: 'object',
          properties: {
            sistemaOrigen: { type: 'string' },
            sistemaDestino: { type: 'string' },
            valorOriginal: { type: 'object' },
            valorConvertido: { type: 'object' },
            reglaAplicada: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// ============================================
// Middlewares
// ============================================
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting global
app.use('/api', generalLimiter);

// ============================================
// Documentacion API
// ============================================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => {
  res.json(swaggerSpec);
});

// ============================================
// Rutas de la API
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/estudiantes', estudianteRoutes);
app.use('/api/instituciones', institucionRoutes);
app.use('/api/materias', materiaRoutes);
app.use('/api/calificaciones', calificacionRoutes);
app.use('/api/conversiones', conversionRoutes);
app.use('/api/trayectorias', trayectoriaRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/auditoria', auditoriaRoutes);

// ============================================
// Ruta de salud
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'edugrade-global-api'
  });
});

// ============================================
// Ruta raiz
// ============================================
app.get('/', (req, res) => {
  res.json({
    name: 'EduGrade Global API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      auth: '/api/auth',
      estudiantes: '/api/estudiantes',
      instituciones: '/api/instituciones',
      materias: '/api/materias',
      calificaciones: '/api/calificaciones',
      conversiones: '/api/conversiones',
      trayectorias: '/api/trayectorias',
      reportes: '/api/reportes',
      auditoria: '/api/auditoria'
    }
  });
});

// ============================================
// Manejo de errores
// ============================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// Iniciar servidor
// ============================================
const startServer = async () => {
  try {
    // Conectar bases de datos
    await connectAllDatabases();

    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`Servidor iniciado en puerto ${PORT}`);
      logger.info(`Documentacion disponible en http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('Error iniciando servidor:', error);
    process.exit(1);
  }
};

// ============================================
// Manejo de cierre
// ============================================
process.on('SIGINT', async () => {
  logger.info('Cerrando servidor...');
  await closeAllConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Cerrando servidor...');
  await closeAllConnections();
  process.exit(0);
});

startServer();
