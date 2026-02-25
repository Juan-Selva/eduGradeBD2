# EduGrade Global - Docker y Contenedores

## Indice

1. [Introduccion a Docker](#introduccion-a-docker)
2. [Docker Compose](#docker-compose)
3. [Servicios del Sistema](#servicios-del-sistema)
4. [Red Docker](#red-docker)
5. [Volumenes y Persistencia](#volumenes-y-persistencia)
6. [Health Checks](#health-checks)
7. [Dockerfiles](#dockerfiles)
8. [Comandos Utiles](#comandos-utiles)

---

## Introduccion a Docker

### Que es Docker?

Docker es una plataforma de contenedorizacion que permite empaquetar aplicaciones con todas sus dependencias en unidades estandarizadas llamadas **contenedores**.

```
+--------------------------------------------------+
|              MAQUINA HOST                         |
|                                                   |
|  +-------------+  +-------------+  +----------+  |
|  | Contenedor  |  | Contenedor  |  |Contenedor|  |
|  |   MongoDB   |  |   Neo4j     |  |  Backend |  |
|  |             |  |             |  |          |  |
|  | - mongo:7.0 |  | - neo4j:5.15|  | - node:20|  |
|  | - config    |  | - plugins   |  | - app.js |  |
|  | - data vol  |  | - data vol  |  | - deps   |  |
|  +-------------+  +-------------+  +----------+  |
|         |               |               |        |
|  +--------------------------------------------------+
|  |            DOCKER ENGINE                         |
|  +--------------------------------------------------+
|                                                   |
+--------------------------------------------------+
```

### Beneficios de Docker

| Beneficio | Descripcion |
|-----------|-------------|
| **Aislamiento** | Cada servicio corre en su propio contenedor sin interferir con otros |
| **Portabilidad** | "Funciona en mi maquina" se convierte en "funciona en cualquier maquina" |
| **Reproducibilidad** | El mismo ambiente en desarrollo, testing y produccion |
| **Versionado** | Imagenes taggeadas permiten rollback facil |
| **Escalabilidad** | Facil de escalar horizontalmente |

---

## Docker Compose

### Que es Docker Compose?

Docker Compose es una herramienta para definir y ejecutar aplicaciones multi-contenedor. Con un archivo YAML se describe toda la infraestructura.

### Estructura del docker-compose.yml

```yaml
version: '3.8'

services:
  # Definicion de cada servicio
  mongodb:
    image: mongo:7.0
    ...

  neo4j:
    image: neo4j:5.15-community
    ...

networks:
  # Red compartida entre servicios
  edugrade-network:
    driver: bridge

volumes:
  # Volumenes para persistencia
  mongodb_data:
    driver: local
```

---

## Servicios del Sistema

### 1. MongoDB Replica Set - Registro Academico (RF1)

MongoDB corre como un **Replica Set de 3 nodos** (`rs0`) para alta disponibilidad y tolerancia a fallos.

```
                    ┌─────────────────────────┐
  Escrituras ──────►│  PRIMARY (27017)        │
                    │  mongodb-primary         │
                    └──────┬──────┬───────────┘
                           │      │
                    copia  │      │  copia
                           ▼      ▼
              ┌──────────────────┐ ┌──────────────────┐
              │ SECONDARY1       │ │ SECONDARY2       │
              │ (27018)          │ │ (27019)          │
              └──────────────────┘ └──────────────────┘
                    ▲                     ▲
                    └───── Lecturas ──────┘
```

**Nodos del Replica Set:**

| Servicio | Contenedor | Puerto | Rol |
|----------|------------|--------|-----|
| `mongodb-primary` | edugrade-mongodb-primary | 27017 | Primario - recibe escrituras |
| `mongodb-secondary1` | edugrade-mongodb-secondary1 | 27018 | Secundario - replica de lectura |
| `mongodb-secondary2` | edugrade-mongodb-secondary2 | 27019 | Secundario - replica de lectura |
| `mongodb-rs-init` | edugrade-mongodb-rs-init | - | Temporal - inicializa el replica set y termina |

**Configuracion del nodo primario:**

```yaml
mongodb-primary:
  image: mongo:7.0
  container_name: edugrade-mongodb-primary
  restart: unless-stopped
  ports:
    - "27017:27017"
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: edugrade2024
    MONGO_INITDB_DATABASE: edugrade
  entrypoint: ["/bin/bash", "-c", "cp /etc/mongo/replica.key.orig /etc/mongo/replica.key && chmod 400 /etc/mongo/replica.key && chown 999:999 /etc/mongo/replica.key && exec docker-entrypoint.sh mongod --replSet rs0 --keyFile /etc/mongo/replica.key --bind_ip_all"]
  volumes:
    - mongodb_data:/data/db
    - ./docker/mongodb/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
    - ./docker/mongodb/replica.key:/etc/mongo/replica.key.orig:ro
```

**Como funciona la replicacion:**

1. Los 3 nodos arrancan con `--replSet rs0` y comparten un `replica.key` para autenticacion interna
2. El contenedor `mongodb-rs-init` ejecuta `rs.initiate()` con los 3 miembros y termina (Exited 0 es normal)
3. Las escrituras van siempre al **Primary**
4. El Primary replica los datos a los Secondaries automaticamente
5. Las lecturas se distribuyen con `readPreference: secondaryPreferred`
6. Si el Primary cae, los otros 2 nodos votan y eligen un nuevo Primary automaticamente

**Archivos de soporte:**

| Archivo | Proposito |
|---------|-----------|
| `docker/mongodb/replica.key` | Keyfile para autenticacion entre nodos del replica set |
| `docker/mongodb/init-replica.sh` | Script que espera al primary y ejecuta `rs.initiate()` |
| `docker/mongodb/init-mongo.js` | Script de inicializacion (indices, schemas) - solo corre en el primario |

### 2. Neo4j - Trayectorias Academicas (RF3)

```yaml
neo4j:
  image: neo4j:5.15-community
  container_name: edugrade-neo4j
  restart: unless-stopped
  ports:
    - "7474:7474"  # HTTP Browser
    - "7687:7687"  # Bolt Protocol
  environment:
    NEO4J_AUTH: neo4j/edugrade2024
    NEO4J_PLUGINS: '["apoc"]'
    NEO4J_dbms_security_procedures_unrestricted: apoc.*
  volumes:
    - neo4j_data:/data
    - neo4j_logs:/logs
  networks:
    - edugrade-network
  healthcheck:
    test: ["CMD", "wget", "-q", "--spider", "http://localhost:7474"]
    interval: 10s
    timeout: 10s
    retries: 10
    start_period: 30s
```

**Puertos de Neo4j:**

```
+-------------------+
|      Neo4j        |
|                   |
|  +-------------+  |
|  | Browser UI  |  |  <-- Puerto 7474 (HTTP)
|  | http://     |  |      Interfaz web para consultas
|  +-------------+  |
|                   |
|  +-------------+  |
|  | Bolt Driver |  |  <-- Puerto 7687 (Bolt)
|  | bolt://     |  |      Protocolo binario para apps
|  +-------------+  |
+-------------------+
```

### 3. Cassandra Cluster - Auditoria y Analitica (RF4/RF5)

Cassandra corre como un **cluster de 3 nodos** con `replication_factor: 3` para alta disponibilidad.

```
              ┌──────────────────┐
              │  SEED NODE       │
              │  cassandra:9042  │
              └──────┬───────────┘
                     │ gossip protocol
          ┌──────────┴──────────┐
          ▼                     ▼
  ┌──────────────┐    ┌──────────────┐
  │  NODE 2      │    │  NODE 3      │
  │  :9043       │    │  :9044       │
  └──────────────┘    └──────────────┘
```

**Nodos del cluster:**

| Servicio | Contenedor | Puerto | Rol |
|----------|------------|--------|-----|
| `cassandra` | edugrade-cassandra | 9042 | Seed node |
| `cassandra-node2` | edugrade-cassandra-node2 | 9043 | Nodo replica |
| `cassandra-node3` | edugrade-cassandra-node3 | 9044 | Nodo replica |

**Configuracion del seed node:**

```yaml
cassandra:
  image: cassandra:4.1
  container_name: edugrade-cassandra
  restart: unless-stopped
  ports:
    - "9042:9042"
  environment:
    CASSANDRA_CLUSTER_NAME: EduGradeCluster
    CASSANDRA_DC: datacenter1
    CASSANDRA_RACK: rack1
    CASSANDRA_ENDPOINT_SNITCH: GossipingPropertyFileSnitch
    MAX_HEAP_SIZE: 512M
    HEAP_NEWSIZE: 100M
  volumes:
    - cassandra_data:/var/lib/cassandra
    - ./docker/cassandra/init-cassandra.cql:/docker-entrypoint-initdb.d/init.cql:ro
```

Los nodos 2 y 3 usan `CASSANDRA_SEEDS: cassandra` para unirse al cluster y dependen del seed node con healthcheck.

**Como funciona la replicacion:**

1. Cassandra **no tiene primary/secondary** — todos los nodos son iguales (peer-to-peer)
2. El **seed node** solo sirve para que los nuevos nodos descubran el cluster
3. Cada dato se replica en **3 nodos** (`replication_factor: 3`)
4. Los nodos se comunican con el **gossip protocol** para compartir el estado del cluster
5. Si un nodo cae, los otros 2 siguen sirviendo las consultas sin interrupcion

**Configuracion de Cassandra:**

| Variable | Valor | Proposito |
|----------|-------|-----------|
| `CASSANDRA_CLUSTER_NAME` | EduGradeCluster | Nombre del cluster |
| `CASSANDRA_DC` | datacenter1 | Datacenter logico |
| `CASSANDRA_RACK` | rack1 | Rack dentro del datacenter |
| `CASSANDRA_ENDPOINT_SNITCH` | GossipingPropertyFileSnitch | Estrategia de descubrimiento de nodos |
| `CASSANDRA_SEEDS` | cassandra | Nodo semilla para unirse al cluster (nodos 2 y 3) |
| `MAX_HEAP_SIZE` | 512M | Memoria maxima de JVM (~512MB por nodo, 1.5GB total) |
| `HEAP_NEWSIZE` | 100M | Memoria para objetos nuevos |

### 4. Redis - Cache y Sesiones (RF2)

```yaml
redis:
  image: redis:7.2-alpine
  container_name: edugrade-redis
  restart: unless-stopped
  ports:
    - "6379:6379"
  command: redis-server --appendonly yes --requirepass edugrade2024
  volumes:
    - redis_data:/data
  networks:
    - edugrade-network
  healthcheck:
    test: ["CMD", "redis-cli", "-a", "edugrade2024", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5
```

**Parametros de Redis:**

| Parametro | Proposito |
|-----------|-----------|
| `--appendonly yes` | Habilita AOF (Append Only File) para persistencia |
| `--requirepass` | Requiere autenticacion |
| `alpine` | Imagen minima basada en Alpine Linux (~5MB) |

### 5. Backend - API REST

```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
  container_name: edugrade-backend
  restart: unless-stopped
  ports:
    - "3000:3000"
  environment:
    NODE_ENV: development
    PORT: 3000
    DOCKER_ENV: "true"
    # MongoDB (Replica Set de 3 nodos)
    MONGODB_URI: mongodb://admin:edugrade2024@mongodb-primary:27017,mongodb-secondary1:27017,mongodb-secondary2:27017/edugrade?authSource=admin&replicaSet=rs0
    # Neo4j
    NEO4J_URI: bolt://neo4j:7687
    NEO4J_USER: neo4j
    NEO4J_PASSWORD: edugrade2024
    # Cassandra (Cluster de 3 nodos)
    CASSANDRA_CONTACT_POINTS: cassandra,cassandra-node2,cassandra-node3
    CASSANDRA_LOCAL_DC: datacenter1
    CASSANDRA_KEYSPACE: edugrade
    # Redis
    REDIS_HOST: redis
    REDIS_PORT: 6379
    REDIS_PASSWORD: edugrade2024
  depends_on:
    mongodb:
      condition: service_healthy
    neo4j:
      condition: service_healthy
    redis:
      condition: service_healthy
  networks:
    - edugrade-network
  volumes:
    - ./backend:/app
    - /app/node_modules
```

**Variables de conexion a bases de datos:**

Las URIs usan los **nombres de los servicios** en lugar de localhost. Docker resuelve estos nombres internamente. Para las bases replicadas, se listan todos los nodos:

```
MongoDB (Replica Set):
  mongodb://admin:...@mongodb-primary:27017,mongodb-secondary1:27017,mongodb-secondary2:27017/edugrade?replicaSet=rs0

Cassandra (Cluster):
  CASSANDRA_CONTACT_POINTS: cassandra,cassandra-node2,cassandra-node3
```

### 6. Frontend - React SPA

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  container_name: edugrade-frontend
  restart: unless-stopped
  ports:
    - "5173:5173"
  environment:
    VITE_API_URL: http://localhost:3000/api
  depends_on:
    - backend
  networks:
    - edugrade-network
  volumes:
    - ./frontend:/app
    - /app/node_modules
```

---

## Red Docker

### Arquitectura de Red

```
+------------------------------------------------------------------+
|                    edugrade-network (bridge)                      |
|                                                                   |
|  +------------+    +------------+    +------------+               |
|  |  mongodb   |    |   neo4j    |    | cassandra  |               |
|  | 172.20.0.2 |    | 172.20.0.3 |    | 172.20.0.4 |               |
|  +------------+    +------------+    +------------+               |
|        |                 |                 |                      |
|        +-----------------+-----------------+                      |
|                          |                                        |
|                    +-----+-----+                                  |
|                    |   redis   |                                  |
|                    | 172.20.0.5|                                  |
|                    +-----------+                                  |
|                          |                                        |
|                    +-----+-----+                                  |
|                    |  backend  |                                  |
|                    | 172.20.0.6|                                  |
|                    +-----------+                                  |
|                          |                                        |
|                    +-----+-----+                                  |
|                    | frontend  |                                  |
|                    | 172.20.0.7|                                  |
|                    +-----------+                                  |
|                                                                   |
+------------------------------------------------------------------+
```

### Tipos de Redes Docker

| Tipo | Descripcion | Uso en EduGrade |
|------|-------------|-----------------|
| **bridge** | Red aislada entre contenedores | Usada para comunicacion interna |
| host | Comparte red del host | No usada |
| none | Sin red | No usada |
| overlay | Multiples hosts Docker | Para produccion con Swarm |

### Comunicacion entre Servicios

Los servicios se comunican usando sus nombres como hostnames:

```javascript
// backend/src/config/database.js

// MongoDB
await mongoose.connect('mongodb://mongodb:27017/edugrade');
//                              ^^^^^^^
//                              Nombre del servicio

// Neo4j
const driver = neo4j.driver('bolt://neo4j:7687');
//                                  ^^^^^

// Redis
const redis = new Redis({ host: 'redis', port: 6379 });
//                              ^^^^^
```

---

## Volumenes y Persistencia

### Que son los Volumenes?

Los volumenes son el mecanismo de Docker para persistir datos fuera del ciclo de vida del contenedor.

```
SIN VOLUMEN:
+-------------+     docker rm     +-------------+
| Contenedor  |  ------------->   |   PERDIDO   |
| + Datos     |                   |             |
+-------------+                   +-------------+

CON VOLUMEN:
+-------------+     docker rm     +-------------+
| Contenedor  |  ------------->   | Nuevo       |
+------+------+                   | Contenedor  |
       |                          +------+------+
       v                                 |
+------+------+                          v
|   Volumen   |  <------------------------
|   (datos)   |
+-------------+
```

### Volumenes Definidos

```yaml
volumes:
  mongodb_data:              # MongoDB Primary
    driver: local
  mongodb_secondary1_data:   # MongoDB Secondary 1
    driver: local
  mongodb_secondary2_data:   # MongoDB Secondary 2
    driver: local
  neo4j_data:                # Datos de Neo4j
    driver: local
  neo4j_logs:                # Logs de Neo4j
    driver: local
  cassandra_data:            # Cassandra Seed Node
    driver: local
  cassandra_node2_data:      # Cassandra Node 2
    driver: local
  cassandra_node3_data:      # Cassandra Node 3
    driver: local
  redis_data:                # Datos de Redis
    driver: local
```

### Mapeo de Volumenes por Servicio

| Servicio | Volumen | Path en Contenedor | Contenido |
|----------|---------|-------------------|-----------|
| MongoDB Primary | mongodb_data | /data/db | Bases de datos (primario) |
| MongoDB Secondary1 | mongodb_secondary1_data | /data/db | Replica de datos |
| MongoDB Secondary2 | mongodb_secondary2_data | /data/db | Replica de datos |
| Neo4j | neo4j_data | /data | Grafos |
| Neo4j | neo4j_logs | /logs | Logs de Neo4j |
| Cassandra (seed) | cassandra_data | /var/lib/cassandra | SSTables |
| Cassandra Node 2 | cassandra_node2_data | /var/lib/cassandra | SSTables replica |
| Cassandra Node 3 | cassandra_node3_data | /var/lib/cassandra | SSTables replica |
| Redis | redis_data | /data | AOF y RDB |

### Bind Mounts para Desarrollo

Ademas de volumenes nombrados, usamos bind mounts para desarrollo:

```yaml
backend:
  volumes:
    - ./backend:/app           # Codigo fuente (bind mount)
    - /app/node_modules        # Volumen anonimo para node_modules
```

Esto permite:
- Editar codigo en el host y verlo reflejado inmediatamente
- Mantener node_modules dentro del contenedor (evita conflictos)

---

## Health Checks

### Proposito de Health Checks

Los health checks permiten a Docker verificar si un servicio esta realmente funcionando, no solo si el proceso existe.

```
Estado del Contenedor:
- starting:   Contenedor iniciando, health check no ejecutado aun
- healthy:    Health check pasando
- unhealthy:  Health check fallando
```

### Health Checks por Servicio

**MongoDB Primary:**
```yaml
healthcheck:
  test: ["CMD", "mongosh", "-u", "admin", "-p", "edugrade2024", "--authenticationDatabase", "admin", "--eval", "db.adminCommand('ping')"]
  interval: 10s       # Cada 10 segundos
  timeout: 5s         # Timeout de 5 segundos
  retries: 10         # 10 intentos antes de unhealthy
  start_period: 30s   # Espera 30s antes de iniciar checks
```

**Neo4j:**
```yaml
healthcheck:
  test: ["CMD", "wget", "-q", "--spider", "http://localhost:7474"]
  interval: 10s
  timeout: 10s
  retries: 10
  start_period: 30s  # Espera 30s antes de iniciar checks
```

**Cassandra:**
```yaml
healthcheck:
  test: ["CMD", "cqlsh", "-e", "describe keyspaces"]
  interval: 30s      # Cassandra es lento, check cada 30s
  timeout: 10s
  retries: 10
```

**Redis:**
```yaml
healthcheck:
  test: ["CMD", "redis-cli", "-a", "edugrade2024", "ping"]
  interval: 10s
  timeout: 5s
  retries: 5
```

### Dependencias con Health Checks

```yaml
backend:
  depends_on:
    mongodb-primary:
      condition: service_healthy   # Espera a que MongoDB Primary este healthy
    neo4j:
      condition: service_healthy   # Espera a que Neo4j este healthy
    redis:
      condition: service_healthy   # Espera a que Redis este healthy
```

Flujo de inicio:

```
1. Docker inicia MongoDB Primary, Neo4j, Redis, Cassandra (seed)
2. Health checks comienzan a ejecutarse
3. Cuando MongoDB Primary esta "healthy":
   - Inician MongoDB Secondary1 y Secondary2
   - Inicia mongodb-rs-init (inicializa replica set y termina)
4. Cuando Cassandra (seed) esta "healthy":
   - Inician cassandra-node2 y cassandra-node3
5. Cuando MongoDB Primary, Neo4j y Redis estan "healthy":
   - Docker inicia Backend
6. Cuando Backend esta corriendo:
   - Docker inicia Frontend
```

---

## Dockerfiles

### Backend Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias del sistema
# (necesarias para compilar algunos modulos nativos)
RUN apk add --no-cache python3 make g++

# Copiar package files primero (aprovecha cache de Docker)
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar codigo fuente
COPY . .

# Puerto de la aplicacion
EXPOSE 3000

# Comando de inicio
CMD ["npm", "run", "dev"]
```

**Explicacion de capas:**

```
+---------------------------+
|  CMD ["npm", "run", "dev"]|  <- Cambia poco
+---------------------------+
|  COPY . .                 |  <- Cambia frecuentemente
+---------------------------+
|  RUN npm install          |  <- Solo si cambia package.json
+---------------------------+
|  COPY package*.json ./    |  <- Cambia poco
+---------------------------+
|  RUN apk add ...          |  <- Casi nunca cambia
+---------------------------+
|  WORKDIR /app             |  <- Nunca cambia
+---------------------------+
|  FROM node:20-alpine      |  <- Nunca cambia
+---------------------------+
```

### Frontend Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
```

El flag `--host` expone Vite a todas las interfaces, necesario para acceder desde fuera del contenedor.

---

## Comandos Utiles

### Iniciar Servicios

```bash
# Iniciar todos los servicios en background
docker compose up -d

# Iniciar con rebuild de imagenes
docker compose up -d --build

# Iniciar solo algunas dependencias
docker compose up -d mongodb neo4j redis

# Iniciar con logs visibles
docker compose up
```

### Ver Estado

```bash
# Ver contenedores corriendo
docker compose ps

# Ver logs de todos los servicios
docker compose logs

# Ver logs de un servicio especifico
docker compose logs backend

# Seguir logs en tiempo real
docker compose logs -f backend

# Ver ultimas 100 lineas
docker compose logs --tail=100 backend
```

### Detener Servicios

```bash
# Detener todos los servicios
docker compose down

# Detener y eliminar volumenes (CUIDADO: borra datos)
docker compose down -v

# Detener un servicio especifico
docker compose stop mongodb
```

### Ejecutar Comandos

```bash
# Ejecutar comando en contenedor corriendo
docker compose exec backend npm test

# Abrir shell en contenedor
docker compose exec backend sh

# Conectar a MongoDB Primary
docker compose exec mongodb-primary mongosh -u admin -p edugrade2024

# Verificar estado del Replica Set
docker exec edugrade-mongodb-primary mongosh -u admin -p edugrade2024 --eval "rs.status()"

# Conectar a Redis
docker compose exec redis redis-cli -a edugrade2024

# Ejecutar CQL en Cassandra
docker compose exec cassandra cqlsh -e "SELECT * FROM edugrade.eventos_auditoria LIMIT 5"

# Verificar estado del cluster Cassandra
docker exec edugrade-cassandra nodetool status
```

### Mantenimiento

```bash
# Reiniciar un servicio
docker compose restart backend

# Reconstruir una imagen
docker compose build backend

# Ver uso de recursos
docker stats

# Limpiar imagenes no usadas
docker image prune

# Limpiar todo (contenedores parados, redes, imagenes)
docker system prune
```

### Troubleshooting

```bash
# Ver eventos de Docker
docker compose events

# Inspeccionar un contenedor
docker inspect edugrade-backend

# Ver configuracion de red
docker network inspect edugrade-global_edugrade-network

# Ver volumenes
docker volume ls

# Inspeccionar volumen
docker volume inspect edugrade-global_mongodb_data
```

---

## Resumen de Puertos

| Servicio | Puerto Host | Puerto Contenedor | Protocolo |
|----------|-------------|-------------------|-----------|
| MongoDB Primary | 27017 | 27017 | TCP (MongoDB Wire) |
| MongoDB Secondary1 | 27018 | 27017 | TCP (MongoDB Wire) |
| MongoDB Secondary2 | 27019 | 27017 | TCP (MongoDB Wire) |
| Neo4j Browser | 7474 | 7474 | HTTP |
| Neo4j Bolt | 7687 | 7687 | Bolt |
| Cassandra (seed) | 9042 | 9042 | CQL |
| Cassandra Node 2 | 9043 | 9042 | CQL |
| Cassandra Node 3 | 9044 | 9042 | CQL |
| Redis | 6379 | 6379 | RESP |
| Backend | 3000 | 3000 | HTTP |
| Frontend | 5173 | 5173 | HTTP |

---

## Proximos Documentos

- **03-BASES-DE-DATOS.md**: Esquemas y modelos detallados de cada base de datos
- **04-BACKEND-API.md**: Documentacion completa de la API REST
- **05-FRONTEND.md**: Estructura y componentes React
- **06-GUIA-INSTALACION.md**: Como ejecutar el proyecto
