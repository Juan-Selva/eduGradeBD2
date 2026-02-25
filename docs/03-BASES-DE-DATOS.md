# EduGrade Global - Bases de Datos

> **Ver tambien:** [03-A-DECISIONES-BASES-DE-DATOS.md](./03-A-DECISIONES-BASES-DE-DATOS.md) - Documentacion detallada sobre por que se eligio cada base de datos, ventajas/desventajas, matriz de decision y arquitectura de persistencia poliglota.

## Indice

1. [Persistencia Poliglota](#persistencia-poliglota)
2. [MongoDB - Base de Documentos](#mongodb---base-de-documentos)
3. [Neo4j - Base de Grafos](#neo4j---base-de-grafos)
4. [Cassandra - Base Columnar](#cassandra---base-columnar)
5. [Redis - Base Clave-Valor](#redis---base-clave-valor)
6. [Conexiones desde el Backend](#conexiones-desde-el-backend)

---

## Persistencia Poliglota

### Concepto

La **persistencia poliglota** (polyglot persistence) es un enfoque arquitectonico que utiliza diferentes bases de datos para diferentes necesidades de almacenamiento, en lugar de forzar todos los datos en una unica base de datos.

### Comparacion de Enfoques

```
ENFOQUE TRADICIONAL (Monolitico):
+------------------------------------------+
|           Base de Datos SQL              |
|  +--------+  +--------+  +--------+     |
|  | Tabla  |  | Tabla  |  | Tabla  |     |
|  | Estud. |  | Califs |  | Audit. |     |
|  +--------+  +--------+  +--------+     |
|                                          |
|  - Un modelo para todo                   |
|  - Joins complejos                       |
|  - Escalamiento vertical costoso         |
+------------------------------------------+

ENFOQUE POLIGLOTA:
+------------+  +------------+  +------------+  +------------+
|  MongoDB   |  |   Neo4j    |  | Cassandra  |  |   Redis    |
| Documentos |  |   Grafos   |  |  Columnar  |  | Key-Value  |
+------------+  +------------+  +------------+  +------------+
      |               |               |               |
      v               v               v               v
 Registros       Relaciones       Auditoria        Cache
 Academicos      Complejas        Masiva          Rapido
```

### Seleccion de Base de Datos por Caso de Uso

| Caso de Uso | Base de Datos | Justificacion |
|-------------|---------------|---------------|
| Datos principales (estudiantes, calificaciones) | MongoDB | Esquema flexible, validaciones, indices |
| Relaciones N:M, trayectorias, equivalencias | Neo4j | Consultas de grafos eficientes |
| Auditoria inmutable, series temporales | Cassandra | Escritura masiva, particionamiento temporal |
| Cache de reglas, sesiones | Redis | Velocidad extrema, TTL automatico |

---

## MongoDB - Base de Documentos

### Por que MongoDB?

MongoDB es una base de datos NoSQL orientada a documentos que almacena datos en formato BSON (Binary JSON).

**Configuracion en EduGrade:** Replica Set de 3 nodos (`rs0`) — 1 Primary + 2 Secondaries. Las escrituras van al Primary y se replican automaticamente. Las lecturas se distribuyen con `readPreference: secondaryPreferred`. Si el Primary cae, se elige automaticamente un nuevo Primary por votacion.

**Ventajas para EduGrade:**

1. **Esquema flexible**: Diferentes sistemas de calificacion tienen estructuras distintas
2. **Validacion nativa**: JSON Schema para garantizar integridad
3. **Indices potentes**: Busquedas eficientes por multiples campos
4. **Agregaciones**: Pipeline de agregacion para reportes complejos
5. **Alta disponibilidad**: Replica Set de 3 nodos con failover automatico

### Colecciones

```
edugrade (database)
|
+-- estudiantes
+-- instituciones
+-- materias
+-- calificaciones
+-- usuarios
```

### Esquema: Estudiantes

```javascript
// Coleccion: estudiantes
{
  _id: ObjectId("..."),
  dni: "12345678",                    // Unico
  nombre: "Juan",
  apellido: "Perez",
  fechaNacimiento: ISODate("2000-01-15"),
  paisOrigen: "AR",                   // UK, US, DE, AR
  email: "juan.perez@email.com",
  direccion: {
    calle: "Av. Corrientes 1234",
    ciudad: "Buenos Aires",
    codigoPostal: "C1043",
    pais: "Argentina"
  },
  estado: "activo",                   // activo, inactivo, graduado
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### Esquema: Instituciones

```javascript
// Coleccion: instituciones
{
  _id: ObjectId("..."),
  codigo: "UBA-FCE",                  // Unico
  nombre: "Universidad de Buenos Aires - Facultad de Ciencias Economicas",
  tipo: "universidad",                // primaria, secundaria, universidad
  sistemaEducativo: "AR",
  pais: "Argentina",
  direccion: {
    calle: "Av. Cordoba 2122",
    ciudad: "Buenos Aires",
    codigoPostal: "C1120"
  },
  contacto: {
    email: "info@fce.uba.ar",
    telefono: "+54 11 5285-6500"
  },
  acreditaciones: ["CONEAU", "AACSB"],
  estado: "activo",
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### Esquema: Materias

```javascript
// Coleccion: materias
{
  _id: ObjectId("..."),
  codigo: "MAT101",
  nombre: "Matematica I",
  descripcion: "Calculo diferencial e integral",
  sistemaEducativo: "AR",
  nivel: "universitario",             // primario, secundario, universitario
  area: "ciencias_exactas",           // ciencias_exactas, humanidades, etc.
  creditos: 6,
  horasCatedra: 96,
  correlativas: [                     // IDs de materias previas requeridas
    ObjectId("..."),
    ObjectId("...")
  ],
  estado: "activo",
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### Esquema: Calificaciones (RF1)

```javascript
// Coleccion: calificaciones
{
  _id: ObjectId("..."),
  calificacionId: "CAL-2024-000001",  // ID legible unico
  estudianteId: ObjectId("..."),
  materiaId: ObjectId("..."),
  institucionId: ObjectId("..."),

  // Sistema de origen y valor original
  sistemaOrigen: "AR",
  valorOriginal: {
    ar: {
      nota: 8,
      aprobado: true,
      instancia: "regular"            // regular, recuperatorio, libre
    }
  },

  // Valor normalizado (escala 0-100)
  valorNormalizado: 80,

  // Metadata de evaluacion
  tipoEvaluacion: "final",            // parcial, final, tp, examen
  fechaEvaluacion: ISODate("2024-06-15"),
  cicloLectivo: {
    anio: 2024,
    periodo: "primer_cuatrimestre"    // anual, primer_cuatrimestre, etc.
  },

  // Inmutabilidad
  hashIntegridad: "sha256:abc123...", // Hash de los datos para verificar
  version: 1,                          // Incrementa si se corrige
  versionAnteriorId: null,             // Referencia a version previa

  // Estado
  estado: "vigente",                   // vigente, corregida, anulada

  // Auditoria
  registradoPor: ObjectId("..."),      // Usuario que registro
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

**Ejemplo de valores originales por sistema:**

```javascript
// Sistema Argentina (AR)
valorOriginal: {
  ar: { nota: 8, aprobado: true, instancia: "regular" }
}

// Sistema Reino Unido (UK)
valorOriginal: {
  uk: { letra: "B", porcentaje: 75, nivel: "A-Level" }
}

// Sistema Estados Unidos (US)
valorOriginal: {
  us: { letra: "B+", gpa: 3.3, creditos: 4 }
}

// Sistema Alemania (DE)
valorOriginal: {
  de: { nota: 2.0, aprobado: true }  // 1.0 = mejor, 6.0 = peor
}
```

### Indices MongoDB

```javascript
// Script: docker/mongodb/init-mongo.js

// Estudiantes
db.estudiantes.createIndex({ dni: 1 }, { unique: true });
db.estudiantes.createIndex({ paisOrigen: 1, estado: 1 });
db.estudiantes.createIndex({ apellido: 1, nombre: 1 });

// Instituciones
db.instituciones.createIndex({ codigo: 1 }, { unique: true });
db.instituciones.createIndex({ sistemaEducativo: 1, tipo: 1 });

// Materias
db.materias.createIndex({ sistemaEducativo: 1, codigo: 1 }, { unique: true });
db.materias.createIndex({ area: 1, nivel: 1 });

// Calificaciones
db.calificaciones.createIndex({ calificacionId: 1 }, { unique: true });
db.calificaciones.createIndex({ estudianteId: 1, materiaId: 1 });
db.calificaciones.createIndex({ sistemaOrigen: 1, 'cicloLectivo.anio': 1 });
db.calificaciones.createIndex({ estado: 1, fechaEvaluacion: -1 });
db.calificaciones.createIndex({ hashIntegridad: 1 });

// Indices compuestos para optimizacion de reportes
db.calificaciones.createIndex({ estado: 1, sistemaOrigen: 1, 'cicloLectivo.anio': 1, materiaId: 1 });
db.calificaciones.createIndex({ estado: 1, 'cicloLectivo.anio': 1, institucionId: 1 });
```

**Proposito de cada indice:**

| Indice | Proposito |
|--------|-----------|
| `dni: 1` | Busqueda rapida por DNI, garantiza unicidad |
| `estudianteId: 1, materiaId: 1` | Buscar calificaciones de un estudiante en una materia |
| `hashIntegridad: 1` | Verificar si una calificacion fue alterada |
| `estado: 1, fechaEvaluacion: -1` | Listar calificaciones vigentes ordenadas |
| `estado, sistemaOrigen, cicloLectivo.anio, materiaId` | Optimiza agregaciones de reportes por materia |
| `estado, cicloLectivo.anio, institucionId` | Optimiza agregaciones de reportes por institucion |

### Validacion JSON Schema

```javascript
db.createCollection('estudiantes', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['dni', 'nombre', 'apellido', 'paisOrigen'],
      properties: {
        dni: {
          bsonType: 'string',
          description: 'DNI debe ser string'
        },
        nombre: {
          bsonType: 'string',
          description: 'Nombre requerido'
        },
        apellido: {
          bsonType: 'string',
          description: 'Apellido requerido'
        },
        paisOrigen: {
          enum: ['UK', 'US', 'DE', 'AR'],
          description: 'Pais debe ser UK, US, DE o AR'
        }
      }
    }
  }
});
```

---

## Neo4j - Base de Grafos

### Por que Neo4j?

Neo4j es una base de datos de grafos que almacena datos como **nodos** y **relaciones**. Es ideal para modelar redes de conexiones.

**Ventajas para EduGrade:**

1. **Relaciones nativas**: Las relaciones son ciudadanos de primera clase
2. **Consultas intuitivas**: Cypher es declarativo y facil de entender
3. **Navegacion eficiente**: Recorrer grafos es O(1) por relacion
4. **Visualizacion**: Browser integrado para explorar datos

### Modelo de Grafos

```
                    +------------------+
                    |   INSTITUCION    |
                    |   (UBA-FCE)      |
                    +--------+---------+
                             ^
                             |
                       ESTUDIA_EN
                             |
+-------------+        +-----+------+        +-------------+
|   MATERIA   |<-CURSA-| ESTUDIANTE |--CURSA->|   MATERIA   |
| (MAT101)    |        |  (Juan)    |        | (PROG101)   |
+------+------+        +------------+        +------+------+
       |                                            |
       v                                            v
  EQUIVALE_A                                   EQUIVALE_A
       |                                            |
       v                                            v
+------+------+                              +------+------+
|   MATERIA   |                              |   MATERIA   |
| (CALC101)   |                              | (CS101)     |
| Sistema: US |                              | Sistema: UK |
+-------------+                              +-------------+
```

### Nodos (Entidades)

```cypher
// Nodo Estudiante
CREATE (e:Estudiante {
  id: "mongo_id_123",
  dni: "12345678",
  nombre: "Juan",
  apellido: "Perez",
  paisOrigen: "AR"
})

// Nodo Materia
CREATE (m:Materia {
  id: "mongo_id_456",
  codigo: "MAT101",
  nombre: "Matematica I",
  sistemaEducativo: "AR",
  nivel: "universitario"
})

// Nodo Institucion
CREATE (i:Institucion {
  id: "mongo_id_789",
  codigo: "UBA-FCE",
  nombre: "UBA - Fac. Ciencias Economicas",
  sistemaEducativo: "AR"
})
```

### Relaciones

```cypher
// Estudiante CURSA Materia
CREATE (e)-[:CURSA {
  calificacionId: "CAL-2024-000001",
  nota: 8,
  fecha: date("2024-06-15"),
  estado: "aprobado"
}]->(m)

// Estudiante ESTUDIA_EN Institucion
CREATE (e)-[:ESTUDIA_EN {
  fechaIngreso: date("2022-03-01"),
  carrera: "Lic. en Economia",
  estado: "activo"
}]->(i)

// Materia EQUIVALE_A Materia (equivalencia entre sistemas)
CREATE (m1:Materia {codigo: "MAT101", sistemaEducativo: "AR"})
       -[:EQUIVALE_A {
         tipoEquivalencia: "total",
         porcentaje: 100,
         aprobadoPor: "Comision Academica",
         fechaAprobacion: date("2023-01-15")
       }]->
       (m2:Materia {codigo: "CALC101", sistemaEducativo: "US"})

// Materia REQUIERE Materia (correlatividad)
CREATE (m2:Materia {codigo: "MAT201"})
       -[:REQUIERE]->(m1:Materia {codigo: "MAT101"})
```

### Consultas Cypher Frecuentes

**Obtener trayectoria de un estudiante:**

```cypher
MATCH (e:Estudiante {id: $estudianteId})
OPTIONAL MATCH (e)-[c:CURSA]->(m:Materia)
OPTIONAL MATCH (e)-[es:ESTUDIA_EN]->(i:Institucion)
RETURN e, collect(DISTINCT {
  materia: m,
  relacion: c
}) as materias,
collect(DISTINCT {
  institucion: i,
  relacion: es
}) as instituciones
```

**Buscar equivalencias de una materia:**

```cypher
MATCH (m1:Materia {id: $materiaId})
      -[eq:EQUIVALE_A*1..2]-(m2:Materia)
WHERE m1 <> m2
RETURN m1, eq, m2
```

**Encontrar camino academico:**

```cypher
MATCH path = (e:Estudiante {id: $id})-[*1..5]->(n)
WHERE n:Materia OR n:Institucion
RETURN path
```

**Verificar correlatividades:**

```cypher
MATCH (m:Materia {id: $materiaId})-[:REQUIERE*]->(prereq:Materia)
MATCH (e:Estudiante {id: $estudianteId})-[c:CURSA]->(aprobada:Materia)
WHERE c.estado = 'aprobado'
WITH prereq, collect(aprobada.id) as aprobadas
WHERE NOT prereq.id IN aprobadas
RETURN prereq as materiasFaltantes
```

### Browser Neo4j

Accesible en: `http://localhost:7474`

- Usuario: `neo4j`
- Password: `edugrade2024`

---

## Cassandra - Base Columnar

### Por que Cassandra?

Apache Cassandra es una base de datos columnar distribuida, disenada para manejar grandes volumenes de datos con alta disponibilidad.

**Configuracion en EduGrade:** Cluster de 3 nodos con `replication_factor: 3`. Cada dato se replica en los 3 nodos para maxima disponibilidad. Los nodos se comunican via gossip protocol y no existe un punto unico de falla.

**Ventajas para EduGrade:**

1. **Escritura masiva**: Optimizada para inserciones append-only
2. **Particionamiento**: Distribuye datos por tiempo automaticamente
3. **Alta disponibilidad**: Cluster de 3 nodos, tolera 1 caida sin impacto
4. **Consistencia eventual**: Ideal para auditoria donde no se requiere inmediatez

### Inicializacion Automatica

El backend inicializa automaticamente el schema de Cassandra al conectarse. Este proceso:

1. **Conecta sin keyspace** para poder crear el keyspace si no existe
2. **Crea el keyspace** `edugrade` con `SimpleStrategy` y `replication_factor: 3` (replicado en los 3 nodos del cluster)
3. **Crea la tabla** `eventos_auditoria` con la estructura de particionamiento temporal
4. **Crea indices secundarios** para `tipo_evento`, `entidad` y `usuario_id`
5. **Reconecta con el keyspace** para operaciones normales

```javascript
// backend/src/config/database.js - initCassandraSchema()
const initCassandraSchema = async (client) => {
  // Crear keyspace si no existe
  await client.execute(`
    CREATE KEYSPACE IF NOT EXISTS ${process.env.CASSANDRA_KEYSPACE}
    WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 3}
  `);

  // Crear tabla de eventos de auditoria
  await client.execute(`
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
  `);

  // Crear indices secundarios
  await client.execute('CREATE INDEX IF NOT EXISTS idx_tipo_evento ON eventos_auditoria (tipo_evento)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_entidad ON eventos_auditoria (entidad)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_usuario ON eventos_auditoria (usuario_id)');
};
```

**Nota sobre sintaxis CQL:** En las consultas con filtros adicionales, el `LIMIT` debe ir **antes** de `ALLOW FILTERING`:

```cql
-- Correcto
SELECT * FROM eventos_auditoria WHERE anio = ? AND mes = ? LIMIT 100 ALLOW FILTERING;

-- Incorrecto (genera error de sintaxis)
SELECT * FROM eventos_auditoria WHERE anio = ? AND mes = ? ALLOW FILTERING LIMIT 100;
```

### Keyspace

```cql
CREATE KEYSPACE IF NOT EXISTS edugrade
WITH replication = {
  'class': 'SimpleStrategy',
  'replication_factor': 3  -- Replicado en los 3 nodos del cluster
};
```

### Tabla: Eventos de Auditoria (RF5)

```cql
CREATE TABLE IF NOT EXISTS eventos_auditoria (
  evento_id UUID,
  tipo_evento TEXT,           -- CREATE, UPDATE, DELETE, CONVERSION, LOGIN
  entidad TEXT,               -- calificacion, estudiante, institucion
  entidad_id TEXT,
  usuario_id TEXT,
  datos TEXT,                 -- JSON con detalles
  ip TEXT,
  timestamp TIMESTAMP,
  anio INT,
  mes INT,
  PRIMARY KEY ((anio, mes), timestamp, evento_id)
) WITH CLUSTERING ORDER BY (timestamp DESC, evento_id ASC)
AND compaction = {
  'class': 'TimeWindowCompactionStrategy',
  'compaction_window_unit': 'DAYS',
  'compaction_window_size': 1
};
```

**Explicacion de la Primary Key:**

```
PRIMARY KEY ((anio, mes), timestamp, evento_id)
             ^^^^^^^^^^^  ^^^^^^^^^  ^^^^^^^^^
             Partition    Clustering Clustering
             Key          Key 1      Key 2

Particion: Todos los eventos del mismo mes van a la misma particion
Ordenamiento: Dentro de la particion, ordenados por timestamp DESC
```

**Beneficios del particionamiento temporal:**

```
+------------------+     +------------------+     +------------------+
| Particion        |     | Particion        |     | Particion        |
| (2024, 1)        |     | (2024, 2)        |     | (2024, 3)        |
|                  |     |                  |     |                  |
| Eventos Enero    |     | Eventos Febrero  |     | Eventos Marzo    |
| 2024             |     | 2024             |     | 2024             |
+------------------+     +------------------+     +------------------+

- Consultas por mes son muy eficientes
- Particiones viejas pueden archivarse
- Compactacion por ventana temporal
```

### Tabla: Calificaciones Historico (RF4)

```cql
CREATE TABLE IF NOT EXISTS calificaciones_historico (
  pais TEXT,
  anio INT,
  mes INT,
  calificacion_id UUID,
  estudiante_id TEXT,
  materia_id TEXT,
  institucion_id TEXT,
  valor_normalizado DECIMAL,
  tipo_evaluacion TEXT,
  fecha_evaluacion TIMESTAMP,
  timestamp_registro TIMESTAMP,
  PRIMARY KEY ((pais, anio), mes, calificacion_id)
) WITH CLUSTERING ORDER BY (mes DESC, calificacion_id ASC);
```

**Casos de uso:**
- Reportes de rendimiento por pais y anio
- Analisis de tendencias temporales
- Comparaciones entre sistemas educativos

### Tabla: Estadisticas Diarias

```cql
CREATE TABLE IF NOT EXISTS estadisticas_diarias (
  pais TEXT,
  fecha DATE,
  total_calificaciones COUNTER,
  suma_valores COUNTER,
  total_aprobados COUNTER,
  total_desaprobados COUNTER,
  PRIMARY KEY (pais, fecha)
) WITH CLUSTERING ORDER BY (fecha DESC);
```

**Uso de COUNTER:**
- Actualizacion atomica de contadores
- Eficiente para metricas agregadas
- No requiere read-before-write

### Tabla: Log de Conversiones

```cql
CREATE TABLE IF NOT EXISTS conversiones_log (
  conversion_id UUID,
  calificacion_id TEXT,
  sistema_origen TEXT,
  sistema_destino TEXT,
  valor_original TEXT,
  valor_convertido TEXT,
  regla_version TEXT,
  timestamp TIMESTAMP,
  usuario_id TEXT,
  PRIMARY KEY ((sistema_origen, sistema_destino), timestamp, conversion_id)
) WITH CLUSTERING ORDER BY (timestamp DESC, conversion_id ASC);
```

### Indices Secundarios

```cql
CREATE INDEX IF NOT EXISTS idx_tipo_evento ON eventos_auditoria (tipo_evento);
CREATE INDEX IF NOT EXISTS idx_entidad ON eventos_auditoria (entidad);
CREATE INDEX IF NOT EXISTS idx_usuario ON eventos_auditoria (usuario_id);
```

### Consultas CQL Frecuentes

**Obtener eventos de auditoria del mes actual:**

```cql
SELECT * FROM eventos_auditoria
WHERE anio = 2024 AND mes = 6
LIMIT 100;
```

**Buscar eventos de un usuario:**

```cql
SELECT * FROM eventos_auditoria
WHERE anio = 2024 AND mes = 6
AND usuario_id = 'user123'
ALLOW FILTERING;
```

**Estadisticas de un pais:**

```cql
SELECT * FROM estadisticas_diarias
WHERE pais = 'AR'
AND fecha >= '2024-01-01'
AND fecha <= '2024-06-30';
```

---

## Redis - Base Clave-Valor

### Por que Redis?

Redis es un almacen de datos en memoria, extremadamente rapido, que soporta estructuras de datos avanzadas.

**Ventajas para EduGrade:**

1. **Velocidad**: Operaciones en memoria (~100k ops/seg)
2. **TTL automatico**: Expiracion automatica de cache
3. **Estructuras de datos**: Strings, Hashes, Sets, Sorted Sets
4. **Persistencia opcional**: AOF y RDB para durabilidad

### Casos de Uso en EduGrade

```
+------------------+     +------------------+     +------------------+     +------------------+
|   Cache Reglas   |     |    Sesiones     |     |  Rate Limiting   |     | Cache Reportes   |
| Conversion       |     |    Usuario      |     |                  |     |                  |
|                  |     |                  |     |                  |     |                  |
| TTL: 1 hora      |     | TTL: 24 horas   |     | TTL: 1 minuto    |     | TTL: 5 minutos   |
+------------------+     +------------------+     +------------------+     +------------------+
```

### Estructura de Claves

```
Patron de nombrado: {prefijo}:{entidad}:{identificador}

Ejemplos:
- regla:conversion:AR:UK     -> Regla de conversion AR a UK
- session:user:abc123        -> Sesion del usuario abc123
- cache:estudiante:12345678  -> Estudiante cacheado por DNI
- ratelimit:ip:192.168.1.1   -> Contador de rate limit
```

### Cache de Reglas de Conversion (RF2)

```javascript
// Clave
"regla:conversion:AR:UK"

// Valor (JSON)
{
  "sistemaOrigen": "AR",
  "sistemaDestino": "UK",
  "tablaEquivalencias": {
    "10": "A*",
    "9": "A",
    "8": "B",
    "7": "C",
    "6": "D",
    "5": "E",
    "1-4": "F"
  },
  "formula": "normalizar -> mapear",
  "version": "2024-01",
  "cacheadoEn": "2024-06-15T10:30:00Z"
}

// TTL: 3600 segundos (1 hora)
```

### Cache de Reportes (Optimizacion de Performance)

Los endpoints de reportes (`/api/reportes/promedios-materia` y `/api/reportes/promedios-institucion`) utilizan cache Redis con soporte de paginacion para mejorar drasticamente los tiempos de respuesta.

```javascript
// Clave para promedios por materia (con paginacion)
"reportes:promedios-materia:{anio}:{pais}:{orden}:{page}:{limit}"

// Clave para promedios por institucion (con paginacion)
"reportes:promedios-institucion:{anio}:{pais}:{orden}:{page}:{limit}"

// Ejemplos
"reportes:promedios-materia:2024:AR:desc:1:10"
"reportes:promedios-institucion:all:all:desc:2:10"
"reportes:promedios-materia:all:UK:asc:1:20"

// TTL: 300 segundos (5 minutos)
```

**Parametros de paginacion:**
| Parametro | Default | Descripcion |
|-----------|---------|-------------|
| page | 1 | Numero de pagina |
| limit | 10 | Items por pagina |
| anio | all | Filtro por año |
| pais | all | Filtro por pais (AR, UK, US, DE) |
| orden | desc | Ordenamiento (asc/desc) |

**Comportamiento:**
- Primera llamada: Ejecuta agregacion MongoDB (~2-5s con indices)
- Llamadas siguientes: Retorna desde cache (<50ms)
- El cache se invalida automaticamente despues de 5 minutos
- Cada combinacion de filtros + pagina se cachea independientemente

**Beneficios de rendimiento:**
| Escenario | Sin cache | Con cache |
|-----------|-----------|-----------|
| Primera llamada | ~32s | ~2-5s |
| Llamadas siguientes | ~32s | <50ms |

### Sesiones de Usuario

```javascript
// Clave
"session:user:507f1f77bcf86cd799439011"

// Valor (Hash)
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "usuario@email.com",
  "rol": "docente",
  "loginAt": "2024-06-15T10:30:00Z",
  "ip": "192.168.1.100"
}

// TTL: 86400 segundos (24 horas)
```

### Tokens de Refresh

```javascript
// Clave
"refresh:token:abc123xyz789"

// Valor
"507f1f77bcf86cd799439011"  // userId

// TTL: 604800 segundos (7 dias)
```

### Blacklist de Tokens

```javascript
// Cuando un usuario hace logout, el token se invalida
"blacklist:token:jwt.token.aqui"

// Valor
"invalidated"

// TTL: Igual al tiempo restante del token
```

### Comandos Redis Frecuentes

```bash
# Conectar a Redis
redis-cli -a edugrade2024

# Ver todas las claves
KEYS *

# Obtener valor
GET regla:conversion:AR:UK

# Setear con TTL
SET cache:temp "valor" EX 3600

# Ver TTL restante
TTL regla:conversion:AR:UK

# Hash operations
HSET session:user:123 email "test@email.com"
HGET session:user:123 email
HGETALL session:user:123

# Incrementar contador
INCR ratelimit:ip:192.168.1.1

# Eliminar clave
DEL cache:temp
```

---

## Conexiones desde el Backend

### Archivo de Configuracion

```javascript
// backend/src/config/database.js

const mongoose = require('mongoose');
const neo4j = require('neo4j-driver');
const cassandra = require('cassandra-driver');
const Redis = require('ioredis');

// ============================================
// MongoDB Connection (Replica Set rs0)
// ============================================
const connectMongoDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 10,              // Maximo conexiones en pool
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    readPreference: 'secondaryPreferred', // Distribuye lecturas a los secondaries
  });
  console.log('MongoDB conectado');
};

// ============================================
// Neo4j Connection
// ============================================
let neo4jDriver = null;

const connectNeo4j = async () => {
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
  console.log('Neo4j conectado');
};

const getNeo4jSession = () => {
  if (!neo4jDriver) throw new Error('Neo4j no conectado');
  return neo4jDriver.session();
};

// ============================================
// Cassandra Connection
// ============================================
let cassandraClient = null;

const connectCassandra = async () => {
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
  console.log('Cassandra conectado');
};

const getCassandraClient = () => {
  if (!cassandraClient) throw new Error('Cassandra no conectado');
  return cassandraClient;
};

// ============================================
// Redis Connection
// ============================================
let redisClient = null;

const connectRedis = async () => {
  redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
  });

  await redisClient.ping();
  console.log('Redis conectado');
};

const getRedisClient = () => {
  if (!redisClient) throw new Error('Redis no conectado');
  return redisClient;
};

// ============================================
// Conectar todas
// ============================================
const connectAllDatabases = async () => {
  await Promise.all([
    connectMongoDB(),
    connectNeo4j(),
    connectRedis(),
  ]);

  // Cassandra tarda mas
  await connectCassandra();

  console.log('Todas las bases de datos conectadas');
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
};
```

### Ejemplo de Uso en Servicios

```javascript
// Servicio que usa multiples bases de datos
const { getNeo4jSession, getCassandraClient, getRedisClient } = require('../config/database');
const Estudiante = require('../models/Estudiante'); // Mongoose model

const getTrayectoriaCompleta = async (estudianteId) => {
  // 1. Buscar datos basicos en MongoDB
  const estudiante = await Estudiante.findById(estudianteId);

  // 2. Buscar grafo en Neo4j
  const session = getNeo4jSession();
  try {
    const result = await session.run(
      `MATCH (e:Estudiante {id: $id})-[r]->(n)
       RETURN e, r, n`,
      { id: estudianteId }
    );
    // procesar result...
  } finally {
    await session.close();
  }

  // 3. Buscar eventos de auditoria en Cassandra
  const cassandra = getCassandraClient();
  const eventos = await cassandra.execute(
    `SELECT * FROM eventos_auditoria
     WHERE anio = ? AND mes = ?
     AND entidad = 'estudiante'
     AND entidad_id = ?`,
    [2024, 6, estudianteId]
  );

  return { estudiante, grafo, eventos };
};
```

---

## Resumen de Bases de Datos

| Base | Modelo | Puertos | Nodos | Caso de Uso | Herramienta de Consulta |
|------|--------|---------|-------|-------------|------------------------|
| MongoDB | Documentos | 27017-27019 | 3 (Replica Set) | Datos principales | MongoDB Compass, mongosh |
| Neo4j | Grafos | 7687 | 1 | Relaciones | Neo4j Browser (7474) |
| Cassandra | Columnar | 9042-9044 | 3 (Cluster) | Auditoria | cqlsh, DataStax Studio |
| Redis | Key-Value | 6379 | 1 | Cache | redis-cli, Redis Insight |

---

## Proximos Documentos

- **04-BACKEND-API.md**: Documentacion completa de la API REST
- **05-FRONTEND.md**: Estructura y componentes React
- **06-GUIA-INSTALACION.md**: Como ejecutar el proyecto
