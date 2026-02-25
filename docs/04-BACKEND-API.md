# EduGrade Global - Backend API

## Indice

1. [Arquitectura del Backend](#arquitectura-del-backend)
2. [Metodos HTTP](#metodos-http)
3. [Estructura de Carpetas](#estructura-de-carpetas)
4. [Endpoints por Modulo](#endpoints-por-modulo)
5. [Middlewares](#middlewares)
6. [Autenticacion JWT](#autenticacion-jwt)
7. [Manejo de Errores](#manejo-de-errores)
8. [Codigos de Estado HTTP](#codigos-de-estado-http)

---

## Arquitectura del Backend

### Patron MVC Adaptado

EduGrade utiliza una arquitectura de capas basada en el patron **Controller-Service-Repository**:

```
+------------------------------------------------------------------+
|                        REQUEST HTTP                               |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                        MIDDLEWARES                                |
|  +----------+  +----------+  +----------+  +----------+          |
|  |   CORS   |  |  Logger  |  | RateLimit|  |   Auth   |          |
|  +----------+  +----------+  +----------+  +----------+          |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                          ROUTES                                   |
|  Define rutas y asocia controladores                              |
|  Aplica middlewares especificos por ruta                          |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                       CONTROLLERS                                 |
|  - Reciben request                                                |
|  - Validan entrada (express-validator)                            |
|  - Llaman a servicios                                             |
|  - Formatean respuesta                                            |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                        SERVICES                                   |
|  - Logica de negocio                                              |
|  - Interactuan con multiples bases de datos                       |
|  - No conocen HTTP (req, res)                                     |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                         MODELS                                    |
|  - Esquemas Mongoose                                              |
|  - Validaciones a nivel de datos                                  |
|  - Hooks pre/post                                                 |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|              DATABASES (MongoDB, Neo4j, Cassandra, Redis)         |
+------------------------------------------------------------------+
```

### Principios de Diseno

1. **Thin Controller, Fat Service**: Los controladores son delgados, la logica reside en servicios
2. **Separacion de responsabilidades**: Cada capa tiene una unica responsabilidad
3. **Inyeccion de dependencias**: Servicios reciben dependencias como parametros
4. **Manejo centralizado de errores**: Un middleware captura todos los errores

---

## Metodos HTTP

### GET - Obtener Recursos

```
GET /api/estudiantes        -> Lista todos (con paginacion)
GET /api/estudiantes/:id    -> Obtiene uno por ID
GET /api/estudiantes?pais=AR -> Filtra por parametros
```

**Caracteristicas:**
- Idempotente (multiples llamadas = mismo resultado)
- No modifica datos
- Cacheable
- Parametros en URL o query string

### POST - Crear Recursos

```
POST /api/estudiantes
Body: { "dni": "12345678", "nombre": "Juan", ... }
```

**Caracteristicas:**
- NO idempotente (cada llamada puede crear un nuevo recurso)
- Crea nuevos recursos
- Body en formato JSON
- Retorna 201 Created con el recurso creado

### PUT - Actualizar Recursos (Completo)

```
PUT /api/estudiantes/:id
Body: { "dni": "12345678", "nombre": "Juan", "apellido": "Garcia", ... }
```

**Caracteristicas:**
- Idempotente
- Reemplaza el recurso completo
- Requiere enviar todos los campos

### PATCH - Actualizar Recursos (Parcial)

```
PATCH /api/estudiantes/:id
Body: { "email": "nuevo@email.com" }
```

**Caracteristicas:**
- Idempotente
- Actualiza solo los campos enviados
- No requiere enviar todo el recurso

### DELETE - Eliminar Recursos

```
DELETE /api/estudiantes/:id
```

**Caracteristicas:**
- Idempotente
- En EduGrade: Soft Delete (marca como inactivo)
- No elimina fisicamente los datos

---

## Estructura de Carpetas

```
backend/
+-- src/
|   +-- config/
|   |   +-- database.js         # Conexiones a 4 DBs
|   |   +-- swagger.js          # Configuracion OpenAPI
|   |
|   +-- controllers/
|   |   +-- auth.controller.js
|   |   +-- estudiante.controller.js
|   |   +-- calificacion.controller.js
|   |   +-- conversion.controller.js
|   |   +-- institucion.controller.js
|   |   +-- materia.controller.js
|   |   +-- reporte.controller.js
|   |   +-- trayectoria.controller.js
|   |   +-- auditoria.controller.js
|   |
|   +-- models/
|   |   +-- Estudiante.js
|   |   +-- Calificacion.js
|   |   +-- Institucion.js
|   |   +-- Materia.js
|   |   +-- Usuario.js
|   |   +-- index.js
|   |
|   +-- routes/
|   |   +-- auth.routes.js
|   |   +-- estudiante.routes.js
|   |   +-- calificacion.routes.js
|   |   +-- conversion.routes.js
|   |   +-- institucion.routes.js
|   |   +-- materia.routes.js
|   |   +-- reporte.routes.js
|   |   +-- trayectoria.routes.js
|   |   +-- auditoria.routes.js
|   |   +-- index.js
|   |
|   +-- services/
|   |   +-- estudiante.service.js
|   |   +-- calificacion.service.js
|   |   +-- conversion.service.js
|   |   +-- trayectoria.service.js
|   |   +-- auditoria.service.js
|   |
|   +-- middlewares/
|   |   +-- auth.js             # JWT Authentication
|   |   +-- rateLimit.js        # Rate limiting
|   |   +-- errorHandler.js     # Manejo de errores
|   |   +-- errors.js           # Clases de error
|   |   +-- validators/         # Validaciones
|   |   +-- index.js
|   |
|   +-- utils/
|   |   +-- logger.js           # Winston logger
|   |   +-- hash.js             # SHA-256 para integridad
|   |
|   +-- app.js                  # Configuracion Express
|   +-- server.js               # Entry point
|
+-- Dockerfile
+-- package.json
+-- .env.example
```

---

## Endpoints por Modulo

### Resumen de Endpoints

| Modulo | Cantidad | Base Path |
|--------|----------|-----------|
| Auth | 7 | /api/auth |
| Estudiantes | 6 | /api/estudiantes |
| Calificaciones | 7 | /api/calificaciones |
| Conversiones | 5 | /api/conversiones |
| Instituciones | 6 | /api/instituciones |
| Materias | 6 | /api/materias |
| Reportes | 9 | /api/reportes |
| Trayectorias | 4 | /api/trayectorias |
| Auditoria | 4 | /api/auditoria |
| **Total** | **54** | |

---

### Auth (7 endpoints)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Registrar usuario | Opcional |
| POST | /api/auth/login | Iniciar sesion | No |
| POST | /api/auth/refresh | Renovar access token | No |
| POST | /api/auth/logout | Cerrar sesion | Si |
| POST | /api/auth/logout-all | Cerrar todas las sesiones | Si |
| GET | /api/auth/me | Obtener usuario actual | Si |
| POST | /api/auth/change-password | Cambiar password | Si |

**Ejemplo: Login**

```bash
# Request
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@edugrade.com",
  "password": "password123"
}

# Response 200 OK
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "usuario": {
    "id": "507f1f77bcf86cd799439011",
    "email": "admin@edugrade.com",
    "nombre": "Admin",
    "apellido": "Sistema",
    "rol": "admin"
  }
}
```

---

### Estudiantes (6 endpoints)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | /api/estudiantes | Listar estudiantes | Si |
| GET | /api/estudiantes/:id | Obtener por ID | Si |
| GET | /api/estudiantes/dni/:dni | Obtener por DNI | Si |
| POST | /api/estudiantes | Crear estudiante | Si |
| PUT | /api/estudiantes/:id | Actualizar estudiante | Si |
| DELETE | /api/estudiantes/:id | Eliminar (soft) | Si |

**Ejemplo: Crear Estudiante**

```bash
# Request
POST /api/estudiantes
Authorization: Bearer <token>
Content-Type: application/json

{
  "dni": "12345678",
  "nombre": "Juan",
  "apellido": "Perez",
  "fechaNacimiento": "2000-01-15",
  "paisOrigen": "AR",
  "email": "juan.perez@email.com",
  "direccion": {
    "calle": "Av. Corrientes 1234",
    "ciudad": "Buenos Aires",
    "codigoPostal": "C1043",
    "pais": "Argentina"
  }
}

# Response 201 Created
{
  "id": "507f1f77bcf86cd799439011",
  "dni": "12345678",
  "nombre": "Juan",
  "apellido": "Perez",
  "paisOrigen": "AR",
  "estado": "activo",
  "createdAt": "2024-06-15T10:30:00.000Z"
}
```

**Query Parameters para GET /api/estudiantes:**

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| page | number | Numero de pagina (default: 1) |
| limit | number | Items por pagina (default: 20) |
| paisOrigen | string | Filtrar por pais (UK, US, DE, AR) |
| estado | string | Filtrar por estado (activo, inactivo) |
| search | string | Buscar en nombre/apellido |

---

### Calificaciones (7 endpoints)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | /api/calificaciones | Listar con filtros | Si |
| GET | /api/calificaciones/:id | Obtener por ID | Si |
| GET | /api/calificaciones/estudiante/:estudianteId | Por estudiante | Si |
| POST | /api/calificaciones | Registrar calificacion | Si |
| POST | /api/calificaciones/:id/corregir | Corregir (nueva version) | Si |
| GET | /api/calificaciones/:id/verificar | Verificar integridad | Si |
| GET | /api/calificaciones/:id/historial | Historial versiones | Si |

**Ejemplo: Registrar Calificacion Argentina**

```bash
# Request
POST /api/calificaciones
Authorization: Bearer <token>
Content-Type: application/json

{
  "estudianteId": "507f1f77bcf86cd799439011",
  "materiaId": "507f1f77bcf86cd799439012",
  "institucionId": "507f1f77bcf86cd799439013",
  "sistemaOrigen": "AR",
  "valorOriginal": {
    "ar": {
      "nota": 8,
      "aprobado": true,
      "instancia": "regular"
    }
  },
  "tipoEvaluacion": "final",
  "fechaEvaluacion": "2024-06-15",
  "cicloLectivo": {
    "anio": 2024,
    "periodo": "primer_cuatrimestre"
  }
}

# Response 201 Created
{
  "id": "507f1f77bcf86cd799439014",
  "calificacionId": "CAL-2024-000001",
  "estudianteId": "507f1f77bcf86cd799439011",
  "sistemaOrigen": "AR",
  "valorOriginal": {
    "ar": { "nota": 8, "aprobado": true, "instancia": "regular" }
  },
  "valorNormalizado": 80,
  "hashIntegridad": "sha256:abc123...",
  "version": 1,
  "estado": "vigente",
  "createdAt": "2024-06-15T10:30:00.000Z"
}
```

**Ejemplo: Corregir Calificacion**

```bash
# Request
POST /api/calificaciones/507f1f77bcf86cd799439014/corregir
Authorization: Bearer <token>
Content-Type: application/json

{
  "valorOriginal": {
    "ar": {
      "nota": 9,
      "aprobado": true,
      "instancia": "regular"
    }
  },
  "motivoCorreccion": "Error de carga - nota correcta es 9"
}

# Response 201 Created
{
  "id": "507f1f77bcf86cd799439015",
  "calificacionId": "CAL-2024-000001",
  "version": 2,
  "versionAnteriorId": "507f1f77bcf86cd799439014",
  "valorOriginal": {
    "ar": { "nota": 9, "aprobado": true, "instancia": "regular" }
  },
  "valorNormalizado": 90,
  "estado": "vigente"
}
```

---

### Conversiones (5 endpoints)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| POST | /api/conversiones/convertir | Convertir a otro sistema | Si |
| POST | /api/conversiones/multiple | Convertir a todos los sistemas | Si |
| GET | /api/conversiones/calificacion/:calificacionId | Conversiones de una calificacion | Si |
| GET | /api/conversiones/reglas | Reglas de conversion vigentes | Si |
| GET | /api/conversiones/tabla/:sistemaOrigen/:sistemaDestino | Tabla de equivalencias | Si |

**Ejemplo: Convertir UK a AR**

```bash
# Request
POST /api/conversiones/convertir
Authorization: Bearer <token>
Content-Type: application/json

{
  "sistemaOrigen": "UK",
  "sistemaDestino": "AR",
  "valorOriginal": {
    "uk": { "letra": "B", "porcentaje": 75 }
  }
}

# Response 200 OK
{
  "sistemaOrigen": "UK",
  "sistemaDestino": "AR",
  "valorOriginal": {
    "uk": { "letra": "B", "porcentaje": 75 }
  },
  "valorNormalizado": 75,
  "valorConvertido": {
    "ar": { "nota": 8, "aprobado": true }
  },
  "reglaAplicada": "Normalizacion via escala 0-100",
  "fecha": "2024-06-15T10:30:00.000Z"
}
```

**Ejemplo: Convertir a Todos los Sistemas**

```bash
# Request
POST /api/conversiones/multiple
Authorization: Bearer <token>
Content-Type: application/json

{
  "sistemaOrigen": "AR",
  "valorOriginal": {
    "ar": { "nota": 8 }
  }
}

# Response 200 OK
{
  "sistemaOrigen": "AR",
  "valorOriginal": { "ar": { "nota": 8 } },
  "valorNormalizado": 80,
  "conversiones": {
    "UK": { "uk": { "letra": "B", "porcentaje": 80 } },
    "US": { "us": { "letra": "B-", "gpa": 2.7 } },
    "DE": { "de": { "nota": 2.3, "aprobado": true } }
  }
}
```

---

### Instituciones (6 endpoints)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | /api/instituciones | Listar instituciones | Si |
| GET | /api/instituciones/:id | Obtener por ID | Si |
| GET | /api/instituciones/codigo/:codigo | Obtener por codigo | Si |
| POST | /api/instituciones | Crear institucion | Si |
| PUT | /api/instituciones/:id | Actualizar institucion | Si |
| DELETE | /api/instituciones/:id | Eliminar (soft) | Si |

---

### Materias (6 endpoints)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | /api/materias | Listar materias | Si |
| GET | /api/materias/:id | Obtener por ID | Si |
| GET | /api/materias/sistema/:sistema | Por sistema educativo | Si |
| POST | /api/materias | Crear materia | Si |
| PUT | /api/materias/:id | Actualizar materia | Si |
| DELETE | /api/materias/:id | Eliminar (soft) | Si |

---

### Reportes (9 endpoints)

| Metodo | Endpoint | Descripcion | Auth | Cache |
|--------|----------|-------------|------|-------|
| GET | /api/reportes/resumen | Resumen para dashboard | Si | No |
| GET | /api/reportes/promedios-materia | Promedios por materia | Si | **Si (5min)** |
| GET | /api/reportes/promedios-institucion | Promedios por institucion | Si | **Si (5min)** |
| GET | /api/reportes/promedio/pais | Promedio por pais | Si | No |
| GET | /api/reportes/promedio/institucion | Promedio por institucion especifica | Si | No |
| GET | /api/reportes/distribucion | Distribucion de notas | Si | No |
| GET | /api/reportes/aprobacion | Tasa de aprobacion | Si | No |
| GET | /api/reportes/historico | Comparacion historica | Si | No |
| GET | /api/reportes/top-materias | Top 10 materias | Si | No |

**Paginacion en Reportes:**

Los endpoints `promedios-materia` y `promedios-institucion` soportan paginacion:

| Parametro | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| page | number | 1 | Numero de pagina |
| limit | number | 10 | Items por pagina |
| pais | string | - | Filtrar por pais (AR, UK, US, DE) |
| orden | string | desc | Ordenar por promedio (asc/desc) |
| anio | number | - | Filtrar por año |

**Optimizacion con Cache Redis:**

Los endpoints `promedios-materia` y `promedios-institucion` implementan cache Redis para mejorar el rendimiento:

- **TTL:** 5 minutos (300 segundos)
- **Primera llamada:** ~2-5 segundos (con indices MongoDB optimizados)
- **Llamadas siguientes:** <50ms (desde cache)
- **Clave de cache:** `reportes:{tipo}:{anio}:{pais}:{orden}:{page}:{limit}`

El cache se invalida automaticamente despues del TTL. Los parametros de query forman parte de la clave de cache, permitiendo cachear diferentes combinaciones de filtros y paginas.

**Ejemplo: Resumen Dashboard**

```bash
# Request
GET /api/reportes/resumen
Authorization: Bearer <token>

# Response 200 OK
{
  "totalEstudiantes": 10000,
  "totalInstituciones": 500,
  "totalMaterias": 1230,
  "totalCalificaciones": 458320,
  "promedioGeneral": 72.45
}
```

**Ejemplo: Promedios por Materia (con paginacion)**

```bash
# Request
GET /api/reportes/promedios-materia?page=1&limit=10&pais=AR&orden=desc
Authorization: Bearer <token>

# Response 200 OK
{
  "data": [
    {
      "materiaId": "507f1f77bcf86cd799439012",
      "nombre": "Matematica I",
      "area": "ciencias_exactas",
      "totalCalificaciones": 1250,
      "totalEstudiantes": 420,
      "promedio": 78.5
    },
    {
      "materiaId": "507f1f77bcf86cd799439013",
      "nombre": "Historia",
      "area": "humanidades",
      "totalCalificaciones": 980,
      "totalEstudiantes": 350,
      "promedio": 75.2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 156,
    "totalPages": 16
  }
}
```

**Ejemplo: Promedios por Institucion (con paginacion)**

```bash
# Request
GET /api/reportes/promedios-institucion?page=2&limit=5&orden=asc
Authorization: Bearer <token>

# Response 200 OK
{
  "data": [
    {
      "institucionId": "507f1f77bcf86cd799439014",
      "nombre": "Universidad de Buenos Aires",
      "pais": "Argentina",
      "totalCalificaciones": 5420,
      "totalEstudiantes": 1200,
      "promedio": 68.9
    }
  ],
  "pagination": {
    "page": 2,
    "limit": 5,
    "total": 500,
    "totalPages": 100
  }
}
```

---

### Trayectorias (4 endpoints)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | /api/trayectorias/estudiante/:estudianteId | Trayectoria completa | Si |
| GET | /api/trayectorias/equivalencias | Equivalencias entre materias | Si |
| POST | /api/trayectorias/equivalencias | Crear equivalencia | Si |
| GET | /api/trayectorias/camino/:estudianteId | Grafo academico | Si |

**Ejemplo: Trayectoria de Estudiante**

```bash
# Request
GET /api/trayectorias/estudiante/507f1f77bcf86cd799439011?incluirConversiones=true
Authorization: Bearer <token>

# Response 200 OK
{
  "estudiante": {
    "id": "507f1f77bcf86cd799439011",
    "nombre": "Juan Perez",
    "paisOrigen": "AR"
  },
  "instituciones": [
    {
      "institucion": { "codigo": "UBA-FCE", "nombre": "UBA - FCE" },
      "fechaIngreso": "2022-03-01",
      "carrera": "Lic. en Economia",
      "estado": "activo"
    }
  ],
  "materias": [
    {
      "materia": { "codigo": "MAT101", "nombre": "Matematica I" },
      "calificacion": {
        "valorOriginal": { "ar": { "nota": 8 } },
        "conversiones": {
          "UK": { "letra": "B" },
          "US": { "gpa": 3.0 },
          "DE": { "nota": 2.3 }
        }
      },
      "estado": "aprobado",
      "fecha": "2024-06-15"
    }
  ],
  "equivalencias": [
    {
      "materiaOrigen": { "codigo": "MAT101", "sistema": "AR" },
      "materiaDestino": { "codigo": "CALC101", "sistema": "US" },
      "tipo": "total",
      "porcentaje": 100
    }
  ]
}
```

---

### Auditoria (4 endpoints)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | /api/auditoria/eventos | Eventos de auditoria | Si (admin) |
| GET | /api/auditoria/entidad/:tipo/:id | Historial de entidad | Si (admin) |
| GET | /api/auditoria/usuario/:usuarioId | Acciones de usuario | Si (admin) |
| GET | /api/auditoria/estadisticas | Estadisticas | Si (admin) |

### Eventos de Auditoria por Modulo

Los siguientes controladores registran eventos de auditoria automaticamente en Cassandra:

| Modulo | Evento | Accion | Datos Registrados |
|--------|--------|--------|-------------------|
| **Estudiantes** | CREATE | Crear estudiante | nombre, apellido |
| | UPDATE | Actualizar estudiante | campos modificados |
| | DELETE | Eliminar (soft delete) | - |
| **Instituciones** | CREATE | Crear institucion | nombre, codigo |
| | UPDATE | Actualizar institucion | campos modificados |
| | DELETE | Eliminar (soft delete) | - |
| **Materias** | CREATE | Crear materia | nombre, codigo |
| | UPDATE | Actualizar materia | campos modificados |
| | DELETE | Eliminar (soft delete) | - |
| **Auth** | LOGIN | Inicio de sesion | email |
| | LOGOUT | Cierre de sesion | email |

**Estructura del evento registrado:**

```javascript
{
  eventoId: UUID,           // Identificador unico
  tipoEvento: String,       // CREATE, UPDATE, DELETE, LOGIN, LOGOUT
  entidad: String,          // estudiante, institucion, materia, usuario
  entidadId: String,        // ID del registro afectado
  usuarioId: String,        // Usuario que realizo la accion
  datos: Object,            // Datos adicionales segun el tipo
  ip: String,               // IP del cliente
  timestamp: Date,          // Fecha/hora del evento
  anio: Number,             // Año (para particionamiento)
  mes: Number               // Mes (para particionamiento)
}
```

**Ejemplo de implementacion en un controlador:**

```javascript
// estudiante.controller.js - Crear estudiante
exports.create = async (req, res) => {
  const estudiante = new Estudiante(req.body);
  await estudiante.save();

  // Registrar evento de auditoria
  await auditoriaService.registrarEvento({
    tipoEvento: 'CREATE',
    entidad: 'estudiante',
    entidadId: estudiante._id.toString(),
    usuarioId: req.user?.id || 'sistema',
    datos: { nombre: estudiante.nombre, apellido: estudiante.apellido },
    ip: req.ip
  });

  res.status(201).json(estudiante);
};
```

**Ejemplo: Eventos de Auditoria**

```bash
# Request
GET /api/auditoria/eventos?tipoEvento=CREATE&entidad=calificacion&limit=10
Authorization: Bearer <token>

# Response 200 OK
{
  "eventos": [
    {
      "eventoId": "550e8400-e29b-41d4-a716-446655440000",
      "tipoEvento": "CREATE",
      "entidad": "calificacion",
      "entidadId": "507f1f77bcf86cd799439014",
      "usuarioId": "507f1f77bcf86cd799439011",
      "datos": {
        "calificacionId": "CAL-2024-000001",
        "nota": 8
      },
      "ip": "192.168.1.100",
      "timestamp": "2024-06-15T10:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

---

## Middlewares

### Flujo de Middlewares

```
Request
   |
   v
+------------------+
|      CORS        |  <- Permite peticiones cross-origin
+------------------+
   |
   v
+------------------+
|   Body Parser    |  <- Parsea JSON
+------------------+
   |
   v
+------------------+
|     Logger       |  <- Registra peticiones
+------------------+
   |
   v
+------------------+
|   Rate Limit     |  <- Limita peticiones por IP
+------------------+
   |
   v
+------------------+
|  Authentication  |  <- Valida JWT
+------------------+
   |
   v
+------------------+
|   Validation     |  <- express-validator
+------------------+
   |
   v
+------------------+
|   Controller     |  <- Logica del endpoint
+------------------+
   |
   v
+------------------+
|  Error Handler   |  <- Captura errores
+------------------+
   |
   v
Response
```

### Rate Limiting

```javascript
// backend/src/middlewares/rateLimit.js

// General: 100 requests/minuto
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: 'Demasiadas solicitudes desde esta IP'
});

// Auth: 5 intentos/15 minutos (previene brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Demasiados intentos de autenticacion',
  skipSuccessfulRequests: true  // Solo cuenta intentos fallidos
});

// Creacion: 30 creaciones/minuto
const createLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30
});

// Reportes: 10 reportes/minuto (operaciones costosas)
const reportLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10
});
```

### Validacion con express-validator

```javascript
// Ejemplo de validacion en rutas
router.post('/register',
  authLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Email invalido')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password debe tener al menos 8 caracteres'),
    body('nombre')
      .trim()
      .notEmpty()
      .withMessage('Nombre requerido'),
    body('rol')
      .optional()
      .isIn(['admin', 'docente', 'administrativo', 'consulta'])
      .withMessage('Rol invalido')
  ],
  validate,  // Middleware que retorna errores si hay
  authController.register
);
```

---

## Autenticacion JWT

### Flujo de Autenticacion

```
1. LOGIN
+--------+    POST /auth/login     +--------+
| Client |  ------------------>   | Server |
|        |  { email, password }   |        |
+--------+                         +--------+
                                       |
                                       v
                               Verifica credenciales
                                       |
                                       v
+--------+    { accessToken,       +--------+
| Client |  <------------------   | Server |
|        |    refreshToken }      |        |
+--------+                         +--------+
    |
    | Guarda tokens en localStorage
    v

2. PETICIONES AUTENTICADAS
+--------+    GET /api/estudiantes  +--------+
| Client |  ----------------------> | Server |
|        |  Authorization:          |        |
|        |  Bearer <accessToken>    |        |
+--------+                          +--------+
                                        |
                                        v
                                Verifica JWT
                                        |
                                        v
+--------+    { estudiantes: [...] }+--------+
| Client |  <---------------------  | Server |
+--------+                          +--------+

3. REFRESH TOKEN (cuando access token expira)
+--------+    POST /auth/refresh   +--------+
| Client |  --------------------> | Server |
|        |  { refreshToken }      |        |
+--------+                         +--------+
                                       |
                                       v
                              Verifica refresh token
                                       |
                                       v
+--------+    { accessToken }      +--------+
| Client |  <------------------   | Server |
+--------+                         +--------+
```

### Estructura del JWT

```javascript
// Header
{
  "alg": "HS256",
  "typ": "JWT"
}

// Payload (Access Token)
{
  "id": "507f1f77bcf86cd799439011",
  "email": "usuario@email.com",
  "rol": "docente",
  "iat": 1718444400,  // Issued at
  "exp": 1718445300   // Expira en 15 min
}

// Payload (Refresh Token)
{
  "id": "507f1f77bcf86cd799439011",
  "iat": 1718444400,
  "exp": 1719049200   // Expira en 7 dias
}
```

### Middleware de Autenticacion

```javascript
// backend/src/middlewares/auth.js

const authenticate = async (req, res, next) => {
  try {
    // 1. Obtener token del header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Token de acceso requerido');
    }

    const token = authHeader.split(' ')[1];

    // 2. Verificar token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 3. Buscar usuario
    const usuario = await Usuario.findById(decoded.id);
    if (!usuario) {
      throw new AuthenticationError('Usuario no encontrado');
    }

    if (usuario.estado !== 'activo') {
      throw new AuthenticationError('Cuenta inactiva');
    }

    // 4. Agregar usuario al request
    req.user = usuario;
    req.userId = usuario._id;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Token expirado'));
    }
    next(error);
  }
};
```

### Roles y Permisos

```javascript
// Middleware que requiere rol especifico
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Autenticacion requerida'));
    }

    if (!roles.includes(req.user.rol)) {
      return next(new AuthorizationError(`Rol requerido: ${roles.join(' o ')}`));
    }

    next();
  };
};

// Uso en rutas
router.get('/auditoria/eventos',
  authenticate,
  requireRole('admin'),
  auditoriaController.getEventos
);
```

---

## Manejo de Errores

### Clases de Error

```javascript
// backend/src/middlewares/errors.js

class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;  // Error esperado vs bug
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'No autenticado') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} no encontrado`, 404, 'NOT_FOUND');
  }
}
```

### Error Handler Centralizado

```javascript
// backend/src/middlewares/errorHandler.js

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Convertir errores de Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    error = new ValidationError('Error de validacion', errors);
  }

  if (err.code === 11000) {  // Duplicado
    const field = Object.keys(err.keyPattern)[0];
    error = new ValidationError(`El ${field} ya existe`);
  }

  // Si no es error operacional, es un bug
  if (!(error instanceof AppError)) {
    error = new AppError(
      process.env.NODE_ENV === 'production'
        ? 'Error interno del servidor'
        : err.message,
      500,
      'INTERNAL_ERROR'
    );
  }

  // Log
  if (error.statusCode >= 500) {
    logger.error('Error:', { message: err.message, stack: err.stack });
  }

  // Respuesta
  res.status(error.statusCode).json({
    error: error.code,
    message: error.message,
    ...(error.errors && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

---

## Codigos de Estado HTTP

### Codigos Exitosos (2xx)

| Codigo | Nombre | Uso en EduGrade |
|--------|--------|-----------------|
| 200 | OK | GET exitoso, PUT exitoso |
| 201 | Created | POST exitoso (recurso creado) |
| 204 | No Content | DELETE exitoso |

### Codigos de Error del Cliente (4xx)

| Codigo | Nombre | Uso en EduGrade |
|--------|--------|-----------------|
| 400 | Bad Request | Validacion fallida, datos invalidos |
| 401 | Unauthorized | Token invalido o ausente |
| 403 | Forbidden | Sin permisos para el recurso |
| 404 | Not Found | Recurso no existe |
| 409 | Conflict | Duplicado (ej: email ya existe) |
| 422 | Unprocessable Entity | Semanticamente incorrecto |
| 429 | Too Many Requests | Rate limit excedido |

### Codigos de Error del Servidor (5xx)

| Codigo | Nombre | Uso en EduGrade |
|--------|--------|-----------------|
| 500 | Internal Server Error | Error no manejado, bug |
| 502 | Bad Gateway | Base de datos no disponible |
| 503 | Service Unavailable | Servicio en mantenimiento |

### Ejemplos de Respuestas de Error

```json
// 400 Bad Request - Validacion
{
  "error": "VALIDATION_ERROR",
  "message": "Error de validacion",
  "errors": [
    { "field": "email", "message": "Email invalido" },
    { "field": "password", "message": "Password debe tener al menos 8 caracteres" }
  ]
}

// 401 Unauthorized
{
  "error": "AUTHENTICATION_ERROR",
  "message": "Token expirado"
}

// 404 Not Found
{
  "error": "NOT_FOUND",
  "message": "Estudiante no encontrado"
}

// 429 Too Many Requests
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Demasiadas solicitudes desde esta IP",
  "retryAfter": 60
}
```

---

## Proximos Documentos

- **05-FRONTEND.md**: Estructura y componentes React
- **06-GUIA-INSTALACION.md**: Como ejecutar el proyecto
