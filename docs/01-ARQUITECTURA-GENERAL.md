# EduGrade Global - Arquitectura General

## Indice

1. [Descripcion del Problema](#descripcion-del-problema)
2. [Solucion Propuesta](#solucion-propuesta)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Stack Tecnologico](#stack-tecnologico)
5. [Sistemas Educativos Soportados](#sistemas-educativos-soportados)
6. [Requerimientos Funcionales](#requerimientos-funcionales)
7. [Analisis del Teorema CAP](#analisis-del-teorema-cap)
8. [Flujo de Datos](#flujo-de-datos)

---

## Descripcion del Problema

El Ministerio de Educacion requiere un sistema nacional de calificaciones que permita:

1. **Registro inmutable de calificaciones**: Las calificaciones academicas son documentos oficiales que no pueden ser modificados sin dejar rastro.

2. **Interoperabilidad internacional**: Estudiantes que provienen de diferentes sistemas educativos (Reino Unido, Estados Unidos, Alemania, Argentina) necesitan que sus calificaciones sean convertidas y reconocidas.

3. **Trazabilidad completa**: Toda operacion sobre el sistema debe quedar registrada para auditorias.

4. **Analisis de datos**: El ministerio necesita reportes estadisticos sobre rendimiento academico a nivel nacional.

5. **Trayectorias academicas**: Seguimiento del recorrido academico del estudiante a traves de diferentes instituciones y sistemas.

---

## Solucion Propuesta

EduGrade Global implementa una arquitectura de **persistencia poliglota** (polyglot persistence), donde cada tipo de dato se almacena en la base de datos mas adecuada para su naturaleza y patron de acceso.

### Principio de Diseno

> "La herramienta correcta para el trabajo correcto"

En lugar de forzar todos los datos en una unica base de datos relacional, utilizamos 4 bases de datos NoSQL especializadas que trabajan en conjunto.

---

## Arquitectura del Sistema

```
+------------------------------------------------------------------+
|                         CLIENTE                                   |
|                    (Navegador Web)                                |
+------------------------------------------------------------------+
                              |
                              | HTTP/HTTPS
                              v
+------------------------------------------------------------------+
|                      FRONTEND                                     |
|                   React 18 + Vite                                 |
|                   Puerto: 5173                                    |
+------------------------------------------------------------------+
                              |
                              | REST API
                              v
+------------------------------------------------------------------+
|                      BACKEND                                      |
|                 Node.js + Express.js                              |
|                   Puerto: 3000                                    |
|                                                                   |
|  +------------+  +------------+  +------------+  +------------+  |
|  |   Auth     |  | Estudiantes|  |Calificacion|  |  Reportes  |  |
|  | Controller |  | Controller |  | Controller |  | Controller |  |
|  +------------+  +------------+  +------------+  +------------+  |
|        |               |               |               |          |
|  +------------------------------------------------------------+  |
|  |                    SERVICES LAYER                          |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
          |              |              |              |
          v              v              v              v
+--------+------+  +-----+------+  +----+------+  +---+--------+
|    MongoDB    |  |   Neo4j    |  | Cassandra |  |   Redis    |
|  (Documentos) |  |  (Grafos)  |  | (Columnar)|  |(Clave-Valor)|
|  Puerto:27017 |  | Puerto:7687|  | Puerto:9042| | Puerto:6379|
+---------------+  +------------+  +-----------+  +------------+
      |                  |               |              |
      v                  v               v              v
+---------------+  +------------+  +-----------+  +------------+
| - Estudiantes |  | - Nodos:   |  | - Eventos |  | - Cache    |
| - Instituciones| |   Estudiante|  |   Auditoria|  |   Reglas   |
| - Materias    |  |   Materia  |  | - Historico|  | - Sesiones |
| - Calificaciones| |   Institucion| |   Calific.|  | - Tokens   |
| - Usuarios    |  | - Relaciones:|  | - Estadist.|  |            |
|               |  |   CURSA    |  |   Diarias  |  |            |
|               |  |   EQUIVALE |  |            |  |            |
|               |  |   ESTUDIA_EN| |            |  |            |
+---------------+  +------------+  +-----------+  +------------+
```

---

## Stack Tecnologico

### Backend

| Tecnologia | Version | Proposito |
|------------|---------|-----------|
| Node.js | 20+ | Runtime de JavaScript |
| Express.js | 4.x | Framework HTTP |
| Mongoose | 8.x | ODM para MongoDB |
| neo4j-driver | 5.x | Driver oficial Neo4j |
| cassandra-driver | 4.x | Driver oficial Cassandra |
| ioredis | 5.x | Cliente Redis |
| jsonwebtoken | 9.x | Autenticacion JWT |
| express-validator | 7.x | Validacion de datos |
| bcryptjs | 2.x | Hash de passwords |
| winston | 3.x | Logging estructurado |

### Frontend

| Tecnologia | Version | Proposito |
|------------|---------|-----------|
| React | 18+ | Libreria UI |
| Vite | 5.x | Build tool y dev server |
| React Router | 6.x | Enrutamiento SPA |
| Axios | 1.x | Cliente HTTP |
| Tailwind CSS | 3.x | Framework CSS utility-first |
| React Query | 5.x | Cache y estado servidor |

### Bases de Datos

| Base de Datos | Version | Modelo | Puerto |
|---------------|---------|--------|--------|
| MongoDB | 7.0 | Documentos | 27017 |
| Neo4j | 5.15 | Grafos | 7474/7687 |
| Cassandra | 4.1 | Columnar | 9042 |
| Redis | 7.2 | Clave-Valor | 6379 |

### Infraestructura

| Tecnologia | Proposito |
|------------|-----------|
| Docker | Contenedorizacion |
| Docker Compose | Orquestacion local |

---

## Sistemas Educativos Soportados

EduGrade Global soporta 4 sistemas de calificaciones internacionales:

### Reino Unido (UK)

```
Sistema A-Level:
A* -> 100%  (Excepcional)
A  -> 90%   (Excelente)
B  -> 80%   (Muy Bueno)
C  -> 70%   (Bueno)
D  -> 60%   (Satisfactorio)
E  -> 50%   (Aprobado)
F  -> 0%    (Reprobado)

Sistema GCSE: Escala numerica 1-9
```

### Estados Unidos (US)

```
Letter Grades + GPA:
A+/A  -> 4.0 GPA (90-100%)
A-    -> 3.7 GPA (87-89%)
B+    -> 3.3 GPA (83-86%)
B     -> 3.0 GPA (80-82%)
B-    -> 2.7 GPA (77-79%)
C+    -> 2.3 GPA (73-76%)
C     -> 2.0 GPA (70-72%)
D     -> 1.0 GPA (60-69%)
F     -> 0.0 GPA (0-59%)
```

### Alemania (DE)

```
Escala 1.0 - 6.0 (1 = mejor):
1.0-1.5 -> Sehr Gut (Muy Bueno)
1.6-2.5 -> Gut (Bueno)
2.6-3.5 -> Befriedigend (Satisfactorio)
3.6-4.0 -> Ausreichend (Suficiente)
4.1-5.0 -> Mangelhaft (Deficiente)
5.1-6.0 -> Ungenugend (Insuficiente)
```

### Argentina (AR)

```
Escala 1-10:
10    -> Sobresaliente
9     -> Distinguido
8     -> Muy Bueno
7     -> Bueno
6     -> Aprobado
1-5   -> Desaprobado
```

### Tabla de Equivalencias

| Argentina | UK (A-Level) | USA (GPA) | Alemania |
|-----------|--------------|-----------|----------|
| 10 | A* | 4.0 (A) | 1.0 |
| 9 | A | 4.0 (A) | 1.3 |
| 8 | B | 3.0 (B) | 2.0 |
| 7 | C | 2.0 (C) | 3.0 |
| 6 | D | 1.0 (D) | 4.0 |
| 5 | E | 0.0 (F) | 5.0 |
| 1-4 | F | 0.0 (F) | 6.0 |

---

## Requerimientos Funcionales

### RF1: Registro Academico Oficial

**Base de datos**: MongoDB

**Descripcion**: Almacenar calificaciones en su formato original con inmutabilidad garantizada.

**Caracteristicas**:
- Esquema flexible para diferentes formatos de calificacion
- Validacion JSON Schema
- Hash de integridad (SHA-256) para verificar no-alteracion
- Versionado de correcciones (nunca se modifica, se crea nueva version)

```javascript
// Ejemplo de documento de calificacion
{
  calificacionId: "CAL-2024-001",
  estudianteId: ObjectId("..."),
  materiaId: ObjectId("..."),
  sistemaOrigen: "AR",
  valorOriginal: {
    ar: { nota: 8, aprobado: true, instancia: "regular" }
  },
  valorNormalizado: 80,  // Escala 0-100
  hashIntegridad: "sha256:abc123...",
  version: 1,
  estado: "vigente"
}
```

### RF2: Conversion entre Escalas

**Base de datos**: Redis (cache) + MongoDB (reglas)

**Descripcion**: Convertir calificaciones entre cualquier par de sistemas educativos.

**Flujo**:
1. Recibir calificacion en sistema origen
2. Normalizar a escala 0-100
3. Convertir a sistema destino
4. Cachear reglas frecuentes en Redis

### RF3: Trayectorias Academicas

**Base de datos**: Neo4j

**Descripcion**: Modelar relaciones complejas entre estudiantes, materias, instituciones.

**Casos de uso**:
- Equivalencias entre materias de diferentes sistemas
- Correlatividades (que materias requieren otras)
- Camino academico del estudiante
- Movilidad entre instituciones

```cypher
// Ejemplo de consulta Cypher
MATCH (e:Estudiante {id: $id})-[:CURSA]->(m:Materia)
      -[:EQUIVALE_A]->(m2:Materia)
RETURN e, m, m2
```

### RF4: Reportes y Estadisticas

**Base de datos**: Cassandra + MongoDB

**Descripcion**: Generar reportes analiticos sobre rendimiento academico.

**Reportes disponibles**:
- Promedio por pais/institucion/materia
- Distribucion de calificaciones
- Tasa de aprobacion
- Comparacion historica
- Top materias por rendimiento

### RF5: Auditoria Inmutable

**Base de datos**: Cassandra

**Descripcion**: Registrar toda operacion del sistema de forma inmutable.

**Caracteristicas**:
- Escritura append-only (nunca se borra)
- Particionamiento por tiempo (anio, mes)
- Compactacion TimeWindow
- Busqueda por tipo, entidad, usuario

```cql
-- Estructura de eventos
PRIMARY KEY ((anio, mes), timestamp, evento_id)
-- Permite consultas eficientes por rango temporal
```

---

## Analisis del Teorema CAP

El teorema CAP establece que un sistema distribuido solo puede garantizar 2 de 3 propiedades:

- **C**onsistency (Consistencia): Todos los nodos ven los mismos datos
- **A**vailability (Disponibilidad): El sistema siempre responde
- **P**artition tolerance (Tolerancia a particiones): Funciona ante fallos de red

### Eleccion por Base de Datos

```
                    CONSISTENCIA
                         |
                         |
            MongoDB(CP)  |
                   \     |
                    \    |
                     \   |
   Neo4j(CA)----------\--|
                       \ |
                        \|
DISPONIBILIDAD ----------+---------- TOLERANCIA
                        /|\          PARTICION
                       / | \
                      /  |  \
                     /   |   \
          Redis(AP)/    |    \Cassandra(AP)
                        |
```

| Base | Trade-off | Justificacion |
|------|-----------|---------------|
| **MongoDB** | CP | Calificaciones requieren consistencia fuerte. Un estudiante no puede ver diferentes notas segun el nodo. |
| **Neo4j** | CA | Relaciones academicas son complejas pero con pocos nodos. Prioriza consistencia y disponibilidad. |
| **Cassandra** | AP | Auditoria prioriza disponibilidad (nunca perder un evento) sobre consistencia inmediata. Consistencia eventual es aceptable. |
| **Redis** | AP | Cache de reglas prioriza velocidad y disponibilidad. Si una regla no esta en cache, se consulta MongoDB. |

---

## Flujo de Datos

### Flujo: Registrar Nueva Calificacion

```
1. Frontend envia POST /api/calificaciones
                |
                v
2. Backend valida datos (express-validator)
                |
                v
3. Calcula hash de integridad (SHA-256)
                |
                v
4. Guarda en MongoDB (documento inmutable)
                |
                +---> 5a. Actualiza grafo en Neo4j
                |          (relacion CURSA)
                |
                +---> 5b. Registra evento en Cassandra
                |          (auditoria)
                |
                v
6. Retorna calificacion con ID
```

### Flujo: Convertir Calificacion

```
1. Frontend envia POST /api/conversiones/convertir
   { sistemaOrigen: "UK", sistemaDestino: "AR", valor: {uk: {letra: "B"}} }
                |
                v
2. Backend busca regla en Redis (cache)
                |
        +-------+-------+
        |               |
     CACHE HIT       CACHE MISS
        |               |
        v               v
3a. Usa regla      3b. Busca en MongoDB
    cacheada           y cachea
        |               |
        +-------+-------+
                |
                v
4. Normaliza a escala 0-100
   UK "B" -> 75 normalizado
                |
                v
5. Aplica conversion a sistema destino
   75 normalizado -> AR nota 8
                |
                v
6. Retorna resultado con regla aplicada
```

### Flujo: Consultar Trayectoria

```
1. Frontend envia GET /api/trayectorias/estudiante/:id
                |
                v
2. Backend ejecuta query Cypher en Neo4j
   MATCH (e:Estudiante)-[r]->(n)
   WHERE e.id = $id
   RETURN e, r, n
                |
                v
3. Neo4j retorna subgrafo del estudiante
   - Instituciones donde estudio
   - Materias cursadas
   - Equivalencias aplicadas
                |
                v
4. Backend enriquece con datos de MongoDB
   (nombres, fechas, detalles)
                |
                v
5. Retorna trayectoria completa
```

---

## Estructura del Proyecto

```
edugrade-global/
|
+-- backend/
|   +-- src/
|   |   +-- config/          # Configuraciones de DBs
|   |   +-- controllers/     # Controladores REST
|   |   +-- models/          # Modelos Mongoose
|   |   +-- routes/          # Definicion de rutas
|   |   +-- services/        # Logica de negocio
|   |   +-- middlewares/     # Auth, validacion, errores
|   |   +-- utils/           # Logger, helpers
|   |   +-- app.js           # Configuracion Express
|   |   +-- server.js        # Entry point
|   +-- Dockerfile
|   +-- package.json
|
+-- frontend/
|   +-- src/
|   |   +-- api/             # Clientes HTTP
|   |   +-- components/      # Componentes React
|   |   +-- context/         # Estado global
|   |   +-- hooks/           # Custom hooks
|   |   +-- pages/           # Paginas/Vistas
|   |   +-- App.jsx          # Componente raiz
|   |   +-- main.jsx         # Entry point
|   +-- Dockerfile
|   +-- package.json
|
+-- docker/
|   +-- mongodb/
|   |   +-- init-mongo.js    # Script inicializacion
|   +-- cassandra/
|       +-- init-cassandra.cql
|
+-- docs/                    # Esta documentacion
+-- postman/                 # Coleccion Postman
+-- docker-compose.yml       # Orquestacion
+-- README.md
```

---

## Proximos Documentos

- **02-DOCKER-Y-CONTENEDORES.md**: Configuracion detallada de Docker
- **03-BASES-DE-DATOS.md**: Esquemas y modelos de cada base de datos
- **04-BACKEND-API.md**: Documentacion completa de la API REST
- **05-FRONTEND.md**: Estructura y componentes React
- **06-GUIA-INSTALACION.md**: Como ejecutar el proyecto
