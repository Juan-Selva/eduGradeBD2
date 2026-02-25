# EduGrade Global - Decisiones de Bases de Datos

## Indice

1. [Introduccion](#introduccion)
2. [Matriz de Decision](#matriz-de-decision)
3. [Bases de Datos Seleccionadas](#bases-de-datos-seleccionadas)
   - [MongoDB](#mongodb)
   - [Neo4j](#neo4j)
   - [Cassandra](#cassandra)
   - [Redis](#redis)
4. [Bases de Datos Descartadas](#bases-de-datos-descartadas)
   - [IRIS](#iris)
   - [InfluxDB](#influxdb)
5. [Arquitectura de Persistencia Poliglota](#arquitectura-de-persistencia-poliglota)
6. [Flujo de Datos](#flujo-de-datos)
7. [Conclusion](#conclusion)

---

## Introduccion

EduGrade Global implementa un enfoque de **persistencia poliglota**, utilizando multiples bases de datos NoSQL especializadas en lugar de una unica base de datos relacional. Esta decision arquitectonica permite optimizar cada tipo de operacion segun las caracteristicas especificas de los datos y los patrones de acceso.

### Problema a Resolver

El sistema debe manejar:
- Registros academicos con esquemas variables segun el pais de origen
- Relaciones complejas entre estudiantes, materias e instituciones
- Equivalencias entre sistemas educativos de 4 paises
- Auditoria inmutable de todas las operaciones
- Cache de alta velocidad para conversiones frecuentes
- Escalabilidad para millones de registros

---

## Matriz de Decision

### Criterios de Evaluacion

| Criterio | Descripcion | Peso |
|----------|-------------|------|
| Flexibilidad de Esquema | Capacidad de manejar datos con estructuras variables | Alto |
| Consultas Complejas | Soporte para consultas avanzadas y relaciones | Alto |
| Escalabilidad | Capacidad de crecer horizontalmente | Medio |
| Performance | Velocidad de lectura/escritura | Alto |
| Facilidad de Uso | Curva de aprendizaje y documentacion | Medio |
| Ecosistema | Herramientas, drivers y comunidad | Medio |
| Costo (Open Source) | Disponibilidad sin costo de licencia | Alto |

### Comparacion de Bases de Datos

```
+---------------------+----------+--------+--------+-----------+--------+----------+
| Criterio            | MongoDB  | Neo4j  | Redis  | Cassandra | IRIS   | InfluxDB |
+---------------------+----------+--------+--------+-----------+--------+----------+
| Flexibilidad        |   ****   | ****   |  **    |    **     |  ****  |    **    |
| Esquema             |          |        |        |           |        |          |
+---------------------+----------+--------+--------+-----------+--------+----------+
| Consultas           |   ***    | *****  |  **    |    **     |  ****  |   ***    |
| Complejas           |          |        |        |           |        |          |
+---------------------+----------+--------+--------+-----------+--------+----------+
| Escalabilidad       |   ***    | ***    |  ***   |   *****   |  ***   |   ****   |
+---------------------+----------+--------+--------+-----------+--------+----------+
| Performance         |   ****   | ***    | *****  |   ****    |  ****  |  *****   |
+---------------------+----------+--------+--------+-----------+--------+----------+
| Facilidad de Uso    |   ****   | ***    |  ****  |    **     |   **   |   ***    |
+---------------------+----------+--------+--------+-----------+--------+----------+
| Ecosistema          |  *****   | ***    |  ****  |   ***     |   **   |   ***    |
+---------------------+----------+--------+--------+-----------+--------+----------+
| Costo (Open Source) |  *****   | ****   | *****  |  *****    |   *    |  *****   |
+---------------------+----------+--------+--------+-----------+--------+----------+

Escala: * = Bajo, ***** = Excelente
```

### Interpretacion de la Matriz

La matriz sirve como guia general. Los pesos de cada criterio se ajustaron segun las prioridades especificas de EduGrade:

- **Sistemas educativos**: Requieren esquema flexible (MongoDB)
- **Equivalencias y trayectorias**: Requieren consultas de grafos (Neo4j)
- **Auditoria**: Requiere escritura masiva e inmutable (Cassandra)
- **Conversiones frecuentes**: Requieren velocidad extrema (Redis)

---

## Bases de Datos Seleccionadas

---

### MongoDB

**Rol en EduGrade:** Base de datos principal para el registro academico oficial (RF1)

#### Por que MongoDB?

MongoDB fue seleccionada como base de datos principal por su capacidad de manejar documentos con esquemas flexibles, lo cual es esencial para un sistema que debe almacenar calificaciones de 4 sistemas educativos diferentes.

#### Ventajas

| Ventaja | Descripcion | Impacto en EduGrade |
|---------|-------------|---------------------|
| **Esquema Flexible** | Los documentos pueden tener estructuras diferentes | Cada pais tiene su propio formato de calificacion |
| **JSON Nativo** | Almacena y consulta datos en formato BSON | Integracion natural con Node.js |
| **Indices Potentes** | Soporta indices compuestos, de texto, geoespaciales | Busquedas rapidas por DNI, materia, periodo |
| **Agregaciones** | Pipeline de agregacion para reportes | Estadisticas por institucion, pais, periodo |
| **Validacion JSON Schema** | Garantiza integridad de datos | Valida estructura de calificaciones |
| **Transacciones ACID** | Operaciones atomicas multi-documento | Registro seguro de calificaciones |
| **Replicacion** | Replica sets para alta disponibilidad | Sin perdida de datos academicos |

#### Desventajas

| Desventaja | Descripcion | Mitigacion |
|------------|-------------|------------|
| **Joins Limitados** | No tiene joins nativos como SQL | Usamos $lookup o desnormalizamos |
| **Consumo de Memoria** | Indices grandes consumen RAM | Indices selectivos, paginacion |
| **Consistencia Eventual** | En replica sets puede haber lag | Read concern majority cuando es critico |
| **Sin Relaciones Nativas** | Las relaciones son por referencia | Neo4j maneja relaciones complejas |

#### Que Almacena

```
MongoDB (edugrade)
|
+-- estudiantes
|   |-- Datos personales (nombre, DNI, email)
|   |-- Pais de origen
|   |-- Historial de sistemas educativos
|   +-- Estado academico
|
+-- instituciones
|   |-- Datos de la institucion
|   |-- Sistema educativo
|   |-- Acreditaciones
|   +-- Contacto
|
+-- materias
|   |-- Codigo y nombre
|   |-- Sistema educativo
|   |-- Componentes de evaluacion
|   +-- Prerequisitos
|
+-- calificaciones
|   |-- Valor original (formato del pais)
|   |-- Valor normalizado (0-100)
|   |-- Hash de integridad (inmutabilidad)
|   |-- Version (correcciones)
|   +-- Auditoria basica
|
+-- usuarios
    |-- Credenciales
    |-- Roles (admin, docente, etc.)
    +-- Permisos
```

#### Arquitectura de Colecciones

```
                         +------------------+
                         |   estudiantes    |
                         |------------------|
                         | _id              |
                         | dni (unique)     |
                         | nombre, apellido |
                         | paisOrigen       |
                         +--------+---------+
                                  |
                                  | referencia
                                  v
+------------------+     +------------------+     +------------------+
|  instituciones   |<----|  calificaciones  |---->|     materias     |
|------------------|     |------------------|     |------------------|
| _id              |     | _id              |     | _id              |
| codigo (unique)  |     | calificacionId   |     | codigo           |
| sistemaEducativo |     | estudianteId     |     | sistemaEducativo |
| pais             |     | materiaId        |     | nivel            |
+------------------+     | institucionId    |     | creditos         |
                         | valorOriginal{}  |     +------------------+
                         | hashIntegridad   |
                         +------------------+
```

---

### Neo4j

**Rol en EduGrade:** Base de datos de grafos para relaciones academicas (RF3)

#### Por que Neo4j?

Neo4j fue seleccionada para modelar las relaciones complejas entre estudiantes, materias e instituciones, incluyendo equivalencias entre sistemas educativos y trayectorias academicas.

#### Ventajas

| Ventaja | Descripcion | Impacto en EduGrade |
|---------|-------------|---------------------|
| **Relaciones Nativas** | Las relaciones son ciudadanos de primera clase | Equivalencias y correlatividades naturales |
| **Lenguaje Cypher** | Consultas declarativas e intuitivas | Facil de entender y mantener |
| **Traversal Eficiente** | O(1) para seguir relaciones | Trayectorias rapidas sin importar el tamano |
| **Visualizacion** | Browser integrado | Explorar grafos visualmente |
| **Propiedades en Relaciones** | Las relaciones tienen atributos | % de equivalencia, fecha de aprobacion |
| **Algoritmos de Grafos** | PageRank, caminos cortos, etc. | Analisis de redes academicas |

#### Desventajas

| Desventaja | Descripcion | Mitigacion |
|------------|-------------|------------|
| **Curva de Aprendizaje** | Cypher requiere pensar en grafos | Documentacion y ejemplos |
| **Escalamiento Horizontal** | Sharding complejo en Community | Suficiente para volumen esperado |
| **Costo Enterprise** | Funciones avanzadas son pagas | Community Edition suficiente |
| **No ACID Global** | Transacciones por nodo/relacion | Disenar consultas atomicas |

#### Que Almacena

```
Neo4j
|
+-- Nodos: Estudiante
|   |-- id (referencia a MongoDB)
|   |-- dni, nombre, apellido
|   +-- paisOrigen
|
+-- Nodos: Materia
|   |-- id (referencia a MongoDB)
|   |-- codigo, nombre
|   +-- sistemaEducativo, nivel
|
+-- Nodos: Institucion
|   |-- id (referencia a MongoDB)
|   |-- codigo, nombre
|   +-- sistemaEducativo
|
+-- Relaciones: CURSA
|   |-- calificacionId
|   |-- nota, fecha
|   +-- estado (aprobado/desaprobado)
|
+-- Relaciones: ESTUDIA_EN
|   |-- fechaIngreso
|   |-- carrera
|   +-- estado
|
+-- Relaciones: EQUIVALE_A
|   |-- tipoEquivalencia
|   |-- porcentaje
|   +-- aprobadoPor, fecha
|
+-- Relaciones: REQUIERE
    +-- (correlatividad entre materias)
```

#### Arquitectura del Grafo

```
                    +----------------+
                    |  INSTITUCION   |
                    |  (UBA-FCE)     |
                    +-------+--------+
                            ^
                            |
                      ESTUDIA_EN
                            |
+------------+       +------+------+       +------------+
|  MATERIA   |<-CURSA| ESTUDIANTE  |CURSA->|  MATERIA   |
| (MAT101)   |       |   (Juan)    |       | (PROG101)  |
| AR         |       +-------------+       | AR         |
+-----+------+                             +-----+------+
      |                                          |
      | EQUIVALE_A                               | EQUIVALE_A
      | (100%)                                   | (80%)
      v                                          v
+-----+------+                             +-----+------+
|  MATERIA   |                             |  MATERIA   |
| (CALC101)  |                             |  (CS101)   |
| US         |                             | UK         |
+------------+                             +------------+
      |
      | REQUIERE
      v
+------------+
|  MATERIA   |
| (CALC201)  |
| US         |
+------------+
```

---

### Cassandra

**Rol en EduGrade:** Base de datos columnar para auditoria y analitica (RF4, RF5)

#### Por que Cassandra?

Cassandra fue seleccionada para manejar la auditoria inmutable y las series temporales de datos academicos, aprovechando su capacidad de escritura masiva y particionamiento temporal.

#### Ventajas

| Ventaja | Descripcion | Impacto en EduGrade |
|---------|-------------|---------------------|
| **Escritura Masiva** | Optimizada para inserciones | Auditoria de alta frecuencia |
| **Append-Only** | Los datos no se modifican | Inmutabilidad garantizada |
| **Particionamiento** | Distribuye por tiempo automaticamente | Consultas eficientes por periodo |
| **Sin Punto Unico de Falla** | Arquitectura masterless | Alta disponibilidad |
| **Escalamiento Lineal** | Agregar nodos aumenta capacidad | Crecimiento predecible |
| **Time-Series Nativo** | Optimizado para datos temporales | Ideal para logs y metricas |
| **Compactacion Temporal** | TWCS para series de tiempo | Almacenamiento eficiente |

#### Desventajas

| Desventaja | Descripcion | Mitigacion |
|------------|-------------|------------|
| **Modelo de Consultas** | Disenar tablas por consulta | Desnormalizacion planificada |
| **Consistencia Eventual** | No ACID por defecto | LOCAL_QUORUM para criticos |
| **Curva de Aprendizaje** | CQL similar pero no igual a SQL | Capacitacion del equipo |
| **Sin Joins** | No soporta joins entre tablas | Datos desnormalizados |
| **Updates Costosos** | Las actualizaciones son tombstones | Solo usamos para append |
| **Startup Lento** | Tarda en arrancar | Health checks con retries |

#### Que Almacena

```
Cassandra (edugrade keyspace)
|
+-- eventos_auditoria
|   |-- evento_id (UUID)
|   |-- tipo_evento (CREATE, UPDATE, LOGIN, etc.)
|   |-- entidad (calificacion, estudiante, etc.)
|   |-- entidad_id
|   |-- usuario_id
|   |-- datos (JSON con detalles)
|   |-- ip, timestamp
|   +-- Particion: (anio, mes)
|
+-- calificaciones_historico
|   |-- calificacion_id
|   |-- estudiante_id, materia_id
|   |-- valor_normalizado
|   |-- tipo_evaluacion
|   +-- Particion: (pais, anio)
|
+-- estadisticas_diarias
|   |-- total_calificaciones (COUNTER)
|   |-- suma_valores (COUNTER)
|   |-- total_aprobados (COUNTER)
|   +-- Particion: (pais, fecha)
|
+-- conversiones_log
    |-- conversion_id
    |-- sistema_origen, sistema_destino
    |-- valor_original, valor_convertido
    |-- regla_version
    +-- Particion: (sistema_origen, sistema_destino)
```

#### Arquitectura de Particiones

```
PARTICIONAMIENTO TEMPORAL - eventos_auditoria
PRIMARY KEY ((anio, mes), timestamp, evento_id)

+------------------+     +------------------+     +------------------+
| Particion        |     | Particion        |     | Particion        |
| (2024, 1)        |     | (2024, 2)        |     | (2024, 3)        |
|------------------|     |------------------|     |------------------|
| evento_1         |     | evento_50        |     | evento_100       |
| evento_2         |     | evento_51        |     | evento_101       |
| ...              |     | ...              |     | ...              |
| evento_49        |     | evento_99        |     | evento_149       |
+------------------+     +------------------+     +------------------+
     Enero 2024              Febrero 2024            Marzo 2024

Beneficios:
- Consultas por mes son O(1) para encontrar particion
- Datos viejos pueden archivarse (particion completa)
- Compactacion TimeWindow optimiza almacenamiento
- Distribucion balanceada entre nodos
```

---

### Redis

**Rol en EduGrade:** Cache de alta velocidad y sesiones (RF2)

#### Por que Redis?

Redis fue seleccionada para cachear las reglas de conversion entre sistemas educativos y manejar sesiones de usuario, aprovechando su velocidad extrema y soporte para TTL automatico.

#### Ventajas

| Ventaja | Descripcion | Impacto en EduGrade |
|---------|-------------|---------------------|
| **Velocidad Extrema** | ~100,000 ops/segundo | Conversiones instantaneas |
| **En Memoria** | Datos en RAM | Latencia sub-milisegundo |
| **TTL Automatico** | Expiracion de claves | Cache auto-renovable |
| **Estructuras de Datos** | Strings, Hashes, Sets, Sorted Sets | Modelado flexible |
| **Atomicidad** | Operaciones atomicas | Rate limiting seguro |
| **Pub/Sub** | Mensajeria en tiempo real | Notificaciones |
| **Persistencia Opcional** | AOF y RDB | Recuperacion tras reinicio |

#### Desventajas

| Desventaja | Descripcion | Mitigacion |
|------------|-------------|------------|
| **Limitado por RAM** | Todo en memoria | Solo datos temporales/cache |
| **Sin Consultas Complejas** | Solo key-value basico | Estructurar claves bien |
| **Persistencia No Garantizada** | Puede perder ultimos datos | Solo cache, no datos criticos |
| **Sin Transacciones Reales** | MULTI/EXEC no es ACID completo | Operaciones atomicas simples |

#### Que Almacena

```
Redis
|
+-- Cache de Reglas de Conversion
|   |-- regla:conversion:AR:UK -> JSON con tabla de equivalencias
|   |-- regla:conversion:AR:US -> JSON con tabla de equivalencias
|   |-- regla:conversion:UK:DE -> JSON con tabla de equivalencias
|   +-- TTL: 1 hora (se recarga desde BD si expira)
|
+-- Sesiones de Usuario
|   |-- session:user:{userId} -> Hash con datos de sesion
|   +-- TTL: 24 horas
|
+-- Tokens de Refresh
|   |-- refresh:token:{token} -> userId
|   +-- TTL: 7 dias
|
+-- Blacklist de Tokens (Logout)
|   |-- blacklist:token:{jwt} -> "invalidated"
|   +-- TTL: tiempo restante del token
|
+-- Cache de Estudiantes
|   |-- cache:estudiante:{dni} -> JSON con datos
|   +-- TTL: 15 minutos
|
+-- Rate Limiting
    |-- ratelimit:ip:{ip} -> contador
    +-- TTL: 1 minuto (ventana de rate limit)
```

#### Arquitectura de Claves

```
PATRON DE NOMBRADO: {prefijo}:{entidad}:{identificador}

+---------------------------+------------------------------------+
| Tipo de Dato              | Patron de Clave                    |
+---------------------------+------------------------------------+
| Regla de conversion       | regla:conversion:{origen}:{destino}|
| Sesion de usuario         | session:user:{userId}              |
| Token de refresh          | refresh:token:{token}              |
| Token en blacklist        | blacklist:token:{jwt}              |
| Cache de estudiante       | cache:estudiante:{dni}             |
| Rate limit por IP         | ratelimit:ip:{ip}                  |
+---------------------------+------------------------------------+

Ejemplo de Regla de Conversion:
KEY: regla:conversion:AR:UK
VALUE: {
  "sistemaOrigen": "AR",
  "sistemaDestino": "UK",
  "tablaEquivalencias": {
    "10": "A*", "9": "A", "8": "B",
    "7": "C", "6": "D", "5": "E", "1-4": "F"
  },
  "version": "2024-01",
  "cacheadoEn": "2024-06-15T10:30:00Z"
}
TTL: 3600 segundos
```

---

## Bases de Datos Descartadas

### IRIS

**InterSystems IRIS** es una plataforma de datos multimodelo propietaria.

#### Por que NO se selecciono

| Factor | Descripcion |
|--------|-------------|
| **Costo de Licencia** | Licencia comercial costosa |
| **Ecosistema Limitado** | Menos drivers y herramientas que alternativas open source |
| **Curva de Aprendizaje** | ObjectScript y arquitectura propietaria |
| **Comunidad Pequena** | Menos recursos, tutoriales y soporte comunitario |
| **Vendor Lock-in** | Dependencia de un unico proveedor |

#### Cuando seria util IRIS

- Entornos empresariales con presupuesto para licencias
- Integracion con sistemas de salud (HL7/FHIR)
- Necesidad de un solo producto multimodelo comercial con soporte

---

### InfluxDB

**InfluxDB** es una base de datos de series temporales.

#### Por que NO se selecciono

| Factor | Descripcion |
|--------|-------------|
| **Especializacion Excesiva** | Optimizada solo para metricas/IoT |
| **Modelo de Datos Rigido** | Tags y fields no se ajustan a calificaciones |
| **Cassandra Suficiente** | Ya tenemos Cassandra para time-series |
| **Sin Relaciones** | No soporta datos relacionales |
| **Overkill para Auditoria** | Disenada para millones de puntos por segundo |

#### Cuando seria util InfluxDB

- Monitoreo de infraestructura (CPU, memoria, red)
- IoT con sensores de alta frecuencia
- Metricas de aplicacion en tiempo real
- Dashboards con Grafana

---

## Arquitectura de Persistencia Poliglota

### Vision General

```
                              +-------------------+
                              |     FRONTEND      |
                              |    (React)        |
                              +--------+----------+
                                       |
                                       | HTTP/REST
                                       v
                              +--------+----------+
                              |     BACKEND       |
                              |   (Node.js)       |
                              +--------+----------+
                                       |
          +----------------+---+-------+-------+---+----------------+
          |                |           |           |                |
          v                v           v           v                v
   +------+------+  +------+------+  +-+----+  +---+--------+  +----+-----+
   |   MongoDB   |  |    Neo4j    |  | Redis |  | Cassandra  |  | Externo  |
   |-------------|  |-------------|  |-------|  |------------|  |----------|
   | Estudiantes |  | Trayectorias|  | Cache |  | Auditoria  |  | APIs     |
   | Materias    |  | Equivalenc. |  | Sesion|  | Historico  |  | externas |
   | Calific.    |  | Correlativ. |  | Rules |  | Estadist.  |  |          |
   +-------------+  +-------------+  +-------+  +------------+  +----------+
```

### Responsabilidades por Capa

```
+------------------------------------------------------------------+
|                         CAPA DE APLICACION                        |
|                                                                    |
|  +------------------+  +------------------+  +------------------+  |
|  | Calificaciones   |  | Trayectorias     |  | Conversiones     |  |
|  | Service          |  | Service          |  | Service          |  |
|  +--------+---------+  +--------+---------+  +--------+---------+  |
|           |                     |                     |            |
+------------------------------------------------------------------+
            |                     |                     |
            v                     v                     v
+------------------------------------------------------------------+
|                         CAPA DE DATOS                             |
|                                                                    |
|  +-------------+  +-------------+  +-------------+  +-------------+|
|  |  MongoDB    |  |   Neo4j     |  |   Redis     |  | Cassandra   ||
|  |-------------|  |-------------|  |-------------|  |-------------||
|  | Documentos  |  |   Grafos    |  | Key-Value   |  |  Columnar   ||
|  | CRUD        |  | Traversal   |  | Cache/TTL   |  | Append-only ||
|  +-------------+  +-------------+  +-------------+  +-------------+|
+------------------------------------------------------------------+
```

### Sincronizacion entre Bases de Datos

```
Operacion: Registrar Calificacion

1. VALIDAR (Redis)
   - Verificar sesion activa
   - Verificar rate limit

2. ESCRIBIR (MongoDB)
   - Crear documento de calificacion
   - Generar hash de integridad

3. ACTUALIZAR GRAFO (Neo4j)
   - Crear relacion CURSA
   - Actualizar propiedades

4. AUDITAR (Cassandra)
   - Registrar evento CREATE
   - Actualizar estadisticas

5. INVALIDAR CACHE (Redis)
   - Eliminar cache relacionado
```

---

## Flujo de Datos

### Registro de Calificacion (RF1)

```
Usuario                Backend                 MongoDB    Neo4j    Cassandra   Redis
   |                      |                       |          |          |         |
   |-- POST /calificacion->|                      |          |          |         |
   |                      |-- verificar sesion ---|----------|----------|-------->|
   |                      |<-- sesion valida -----|----------|----------|---------|
   |                      |                       |          |          |         |
   |                      |-- crear documento --->|          |          |         |
   |                      |<-- calificacion_id ---|          |          |         |
   |                      |                       |          |          |         |
   |                      |-- crear relacion CURSA---------->|          |         |
   |                      |<-- ok ----------------|----------|          |         |
   |                      |                       |          |          |         |
   |                      |-- registrar evento ---|----------|--------->|         |
   |                      |<-- ok ----------------|----------|----------|         |
   |                      |                       |          |          |         |
   |<-- 201 Created ------|                       |          |          |         |
```

### Conversion de Calificacion (RF2)

```
Usuario                Backend                 Redis      MongoDB
   |                      |                       |          |
   |-- GET /convertir --->|                       |          |
   |                      |-- buscar regla ------>|          |
   |                      |                       |          |
   |    [Cache HIT]       |<-- regla -------------|          |
   |                      |-- aplicar regla       |          |
   |<-- resultado --------|                       |          |
   |                      |                       |          |
   |    [Cache MISS]      |                       |          |
   |                      |<-- null --------------|          |
   |                      |-- buscar regla -------|--------->|
   |                      |<-- regla -------------|----------|
   |                      |-- cachear regla ----->|          |
   |                      |-- aplicar regla       |          |
   |<-- resultado --------|                       |          |
```

### Consulta de Trayectoria (RF3)

```
Usuario                Backend                 Neo4j      MongoDB
   |                      |                       |          |
   |-- GET /trayectoria ->|                       |          |
   |                      |-- MATCH grafo ------->|          |
   |                      |<-- nodos y relaciones-|          |
   |                      |                       |          |
   |                      |-- enriquecer datos ---|--------->|
   |                      |<-- detalles completos-|----------|
   |                      |                       |          |
   |<-- trayectoria ------|                       |          |
```

---

## Conclusion

### Resumen de Decisiones

| Base de Datos | Seleccionada | Justificacion Principal |
|---------------|--------------|------------------------|
| **MongoDB** | Si | Esquema flexible para sistemas educativos heterogeneos |
| **Neo4j** | Si | Modelado natural de equivalencias y trayectorias |
| **Cassandra** | Si | Auditoria inmutable con particionamiento temporal |
| **Redis** | Si | Cache de alta velocidad para conversiones frecuentes |
| **IRIS** | No | Costo de licencia y ecosistema limitado |
| **InfluxDB** | No | Especializacion excesiva, Cassandra ya cubre el caso |

### Beneficios de la Arquitectura

1. **Cada base de datos hace lo que mejor sabe hacer**
2. **Escalamiento independiente por tipo de carga**
3. **Optimizacion de costos (solo open source)**
4. **Flexibilidad para cambios futuros**
5. **Performance predecible por tipo de operacion**

### Trade-offs Aceptados

1. **Complejidad operacional** - 4 bases de datos que mantener
2. **Consistencia eventual** - Sincronizacion entre BDs no es instantanea
3. **Curva de aprendizaje** - El equipo debe conocer 4 tecnologias
4. **Codigo adicional** - Logica de sincronizacion en el backend

### Recomendaciones Futuras

- **Monitoreo**: Implementar dashboards para las 4 bases de datos
- **Backups**: Estrategia de backup unificada
- **Testing**: Tests de integracion que validen consistencia
- **Documentacion**: Mantener actualizada esta documentacion

---

## Referencias

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Neo4j Documentation](https://neo4j.com/docs/)
- [Apache Cassandra Documentation](https://cassandra.apache.org/doc/)
- [Redis Documentation](https://redis.io/documentation)
- Martin Fowler - Polyglot Persistence
- Pramod Sadalage, Martin Fowler - NoSQL Distilled
