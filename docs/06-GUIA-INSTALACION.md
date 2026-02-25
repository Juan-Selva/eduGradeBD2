# EduGrade Global - Guia de Instalacion

## Indice

1. [Requisitos Previos](#requisitos-previos)
2. [Instalacion Rapida con Docker](#instalacion-rapida-con-docker)
3. [Verificar Servicios](#verificar-servicios)
4. [Acceder a la Aplicacion](#acceder-a-la-aplicacion)
5. [Credenciales por Defecto](#credenciales-por-defecto)
6. [Cargar Datos de Prueba](#cargar-datos-de-prueba)
7. [Desarrollo Local](#desarrollo-local)
8. [Coleccion Postman](#coleccion-postman)
9. [Troubleshooting](#troubleshooting)

---

## Requisitos Previos

### Software Requerido

| Software | Version Minima | Verificar Instalacion |
|----------|----------------|----------------------|
| Docker | 20.10+ | `docker --version` |
| Docker Compose | 2.0+ | `docker compose version` |
| Git | 2.30+ | `git --version` |
| Node.js (opcional) | 18+ | `node --version` |

### Recursos de Hardware Recomendados

| Recurso | Minimo | Recomendado |
|---------|--------|-------------|
| RAM | 8 GB | 16 GB |
| CPU | 2 cores | 4 cores |
| Disco | 10 GB libres | 20 GB libres |

### Puertos Requeridos

Asegurate de que los siguientes puertos esten disponibles:

| Puerto | Servicio |
|--------|----------|
| 3000 | Backend API |
| 5173 | Frontend React |
| 27017 | MongoDB |
| 7474 | Neo4j Browser |
| 7687 | Neo4j Bolt |
| 9042 | Cassandra |
| 6379 | Redis |

Para verificar si un puerto esta en uso:

```bash
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000
```

---

## Instalacion Rapida con Docker

### Paso 1: Clonar el Repositorio

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/edugrade-global.git

# Navegar al directorio
cd edugrade-global
```

### Paso 2: Iniciar los Servicios

```bash
# Iniciar todos los contenedores
docker compose up -d
```

Este comando:
1. Descarga las imagenes necesarias (MongoDB, Neo4j, Cassandra, Redis)
2. Construye las imagenes del backend y frontend
3. Crea la red Docker
4. Inicia todos los contenedores
5. Ejecuta los scripts de inicializacion

**Primera vez puede tardar 5-10 minutos** mientras descarga las imagenes.

### Paso 3: Verificar que Todo Este Corriendo

```bash
# Ver estado de los contenedores
docker compose ps
```

Deberias ver algo como:

```
NAME                  STATUS          PORTS
edugrade-mongodb      Up (healthy)    0.0.0.0:27017->27017/tcp
edugrade-neo4j        Up (healthy)    0.0.0.0:7474->7474/tcp, 0.0.0.0:7687->7687/tcp
edugrade-cassandra    Up (healthy)    0.0.0.0:9042->9042/tcp
edugrade-redis        Up (healthy)    0.0.0.0:6379->6379/tcp
edugrade-backend      Up              0.0.0.0:3000->3000/tcp
edugrade-frontend     Up              0.0.0.0:5173->5173/tcp
```

**IMPORTANTE**: Espera a que todos los servicios muestren `Up (healthy)` antes de continuar.

---

## Verificar Servicios

### Backend API

```bash
# Verificar que el backend responde
curl http://localhost:3000/api/health

# Respuesta esperada:
# {"status":"ok","timestamp":"2024-06-15T10:30:00.000Z"}
```

O abre en el navegador: http://localhost:3000/api-docs (Swagger UI)

### MongoDB

```bash
# Conectar a MongoDB
docker compose exec mongodb mongosh -u admin -p edugrade2024

# Dentro de mongosh:
use edugrade
show collections
# Deberia mostrar: estudiantes, instituciones, materias, calificaciones
```

### Neo4j

Abrir en navegador: http://localhost:7474

- Usuario: `neo4j`
- Password: `edugrade2024`

Probar query:
```cypher
RETURN "Neo4j funcionando!" AS mensaje
```

### Cassandra

```bash
# Conectar a Cassandra
docker compose exec cassandra cqlsh

# Dentro de cqlsh:
DESCRIBE KEYSPACES;
# Deberia mostrar: edugrade

USE edugrade;
DESCRIBE TABLES;
# Deberia mostrar las tablas de auditoria
```

### Redis

```bash
# Conectar a Redis
docker compose exec redis redis-cli -a edugrade2024

# Dentro de redis-cli:
PING
# Respuesta: PONG

KEYS *
# Muestra claves almacenadas
```

---

## Acceder a la Aplicacion

### URLs Principales

| Servicio | URL | Descripcion |
|----------|-----|-------------|
| **Frontend** | http://localhost:5173 | Aplicacion React |
| **Backend API** | http://localhost:3000 | API REST |
| **Swagger Docs** | http://localhost:3000/api-docs | Documentacion interactiva |
| **Neo4j Browser** | http://localhost:7474 | Interfaz Neo4j |

### Flujo de Acceso

```
1. Abrir http://localhost:5173 en el navegador
2. Iniciar sesion con las credenciales por defecto
3. Explorar el dashboard y las diferentes secciones
```

---

## Credenciales por Defecto

### Usuario de la Aplicacion

```
Email:    admin@edugrade.com
Password: admin123
```

### Bases de Datos

| Servicio | Usuario | Password |
|----------|---------|----------|
| MongoDB | admin | edugrade2024 |
| Neo4j | neo4j | edugrade2024 |
| Redis | - | edugrade2024 |
| Cassandra | - | - (sin auth en dev) |

---

## Cargar Datos de Prueba

### Opcion 1: Script de Carga (1 Millon de Registros)

```bash
# Desde el directorio raiz
cd backend
npm install
cp .env.example .env
npm run load-million
```

Este script carga:
- ~100,000 estudiantes
- ~200 instituciones
- ~500 materias
- ~900,000 calificaciones

**Advertencia**: Puede tardar 15-30 minutos y requiere ~4GB de RAM.

### Opcion 2: Datos de Prueba Minimos

```bash
# Entrar al contenedor del backend
docker compose exec backend sh

# Ejecutar script de seed
npm run seed

# Salir
exit
```

Esto crea:
- 10 estudiantes de cada pais
- 5 instituciones
- 20 materias
- 100 calificaciones

---

## Desarrollo Local

Para desarrollar sin Docker (ejecutar servicios directamente):

### Backend

```bash
# 1. Navegar al directorio
cd backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env

# 4. Editar .env con las conexiones locales
#    (asegurate de tener las DBs corriendo)

# 5. Iniciar en modo desarrollo (con hot reload)
npm run dev
```

**Contenido de `.env` para desarrollo local:**

```env
NODE_ENV=development
PORT=3000

# MongoDB (local)
MONGODB_URI=mongodb://admin:edugrade2024@localhost:27017/edugrade?authSource=admin

# Neo4j (local)
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=edugrade2024

# Cassandra (local)
CASSANDRA_CONTACT_POINTS=localhost
CASSANDRA_LOCAL_DC=datacenter1
CASSANDRA_KEYSPACE=edugrade

# Redis (local)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=edugrade2024

# JWT
JWT_SECRET=tu-clave-secreta-muy-segura
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

### Frontend

```bash
# 1. Navegar al directorio
cd frontend

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

El frontend estara disponible en http://localhost:5173

---

## Coleccion Postman

### Importar Coleccion

1. Abrir Postman
2. Click en "Import"
3. Seleccionar archivo `postman/EduGrade-Global.postman_collection.json`
4. Importar el environment `postman/EduGrade-Local.postman_environment.json`

### Variables de Entorno Postman

| Variable | Valor |
|----------|-------|
| `baseUrl` | http://localhost:3000/api |
| `token` | (se llena automaticamente al hacer login) |

### Endpoints Disponibles

La coleccion incluye todos los endpoints organizados por modulo:

```
EduGrade Global
+-- Auth
|   +-- Login
|   +-- Register
|   +-- Refresh Token
|   +-- Me
|   +-- Logout
|
+-- Estudiantes
|   +-- Listar
|   +-- Obtener por ID
|   +-- Obtener por DNI
|   +-- Crear
|   +-- Actualizar
|   +-- Eliminar
|
+-- Calificaciones
|   +-- Listar
|   +-- Por Estudiante
|   +-- Crear
|   +-- Corregir
|   +-- Verificar Integridad
|   +-- Historial
|
+-- Conversiones
|   +-- Convertir
|   +-- Convertir Multiple
|   +-- Tabla Equivalencias
|
+-- Instituciones
+-- Materias
+-- Reportes
+-- Trayectorias
+-- Auditoria
```

### Ejemplo de Uso

1. **Hacer Login** (guarda el token automaticamente)
2. **Crear Estudiante** (usa el token guardado)
3. **Crear Calificacion** para ese estudiante
4. **Ver Trayectoria** del estudiante

---

## Troubleshooting

### Problema: Los contenedores no inician

**Sintoma**: `docker compose up` falla o contenedores reinician constantemente.

**Solucion**:
```bash
# Ver logs detallados
docker compose logs

# Ver logs de un servicio especifico
docker compose logs mongodb
docker compose logs backend

# Reiniciar desde cero
docker compose down -v
docker compose up -d
```

### Problema: Backend no conecta a las bases de datos

**Sintoma**: Errores de conexion en los logs del backend.

**Solucion**:
```bash
# Verificar que las DBs esten healthy
docker compose ps

# Si Cassandra no esta ready, esperar mas tiempo
# Cassandra puede tardar 2-3 minutos en iniciar

# Reiniciar solo el backend
docker compose restart backend
```

### Problema: Puerto ya en uso

**Sintoma**: Error "port is already allocated"

**Solucion**:
```bash
# Windows - encontrar proceso usando el puerto
netstat -ano | findstr :3000

# Matar proceso por PID
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>

# O cambiar el puerto en docker-compose.yml
ports:
  - "3001:3000"  # Usar puerto 3001 en el host
```

### Problema: Neo4j no responde

**Sintoma**: No se puede acceder a http://localhost:7474

**Solucion**:
```bash
# Neo4j tarda en iniciar, verificar logs
docker compose logs neo4j

# Si hay errores de memoria
# Aumentar memoria en docker-compose.yml:
environment:
  NEO4J_dbms_memory_heap_initial__size: 512m
  NEO4J_dbms_memory_heap_max__size: 1G
```

### Problema: Frontend muestra pantalla en blanco

**Sintoma**: http://localhost:5173 carga pero esta vacio

**Solucion**:
```bash
# Verificar logs del frontend
docker compose logs frontend

# Verificar que el backend este corriendo
curl http://localhost:3000/api/health

# Reconstruir el frontend
docker compose build frontend
docker compose up -d frontend
```

### Problema: Cassandra timeout

**Sintoma**: Errores "NoHostAvailableException" o timeouts

**Solucion**:
Cassandra es la base de datos que mas tarda en estar lista.

```bash
# Verificar estado
docker compose logs cassandra

# Esperar hasta ver "Startup complete"
# Puede tardar 2-5 minutos

# Si sigue fallando, aumentar recursos
# En docker-compose.yml:
environment:
  MAX_HEAP_SIZE: 1G
  HEAP_NEWSIZE: 256M
```

### Problema: Errores de autenticacion

**Sintoma**: Login falla con credenciales correctas

**Solucion**:
```bash
# Verificar que el usuario admin exista
docker compose exec mongodb mongosh -u admin -p edugrade2024 --eval "
  use edugrade;
  db.usuarios.findOne({email: 'admin@edugrade.com'})
"

# Si no existe, ejecutar seed
docker compose exec backend npm run seed
```

### Comandos Utiles de Diagnostico

```bash
# Ver todos los logs en tiempo real
docker compose logs -f

# Ver uso de recursos
docker stats

# Inspeccionar un contenedor
docker inspect edugrade-backend

# Entrar a un contenedor
docker compose exec backend sh

# Reiniciar todo desde cero
docker compose down -v
docker system prune -f
docker compose up -d
```

---

## Detener y Limpiar

### Detener los Servicios

```bash
# Detener sin eliminar datos
docker compose down

# Detener y eliminar volumenes (BORRA DATOS)
docker compose down -v
```

### Limpiar Todo

```bash
# Eliminar contenedores, imagenes y volumenes no usados
docker system prune -a --volumes

# Solo eliminar volumenes de este proyecto
docker volume rm edugrade-global_mongodb_data
docker volume rm edugrade-global_neo4j_data
docker volume rm edugrade-global_cassandra_data
docker volume rm edugrade-global_redis_data
```

---

## Resumen de Comandos

| Accion | Comando |
|--------|---------|
| Iniciar todo | `docker compose up -d` |
| Ver estado | `docker compose ps` |
| Ver logs | `docker compose logs -f` |
| Detener todo | `docker compose down` |
| Reiniciar servicio | `docker compose restart backend` |
| Reconstruir | `docker compose build --no-cache` |
| Limpiar todo | `docker compose down -v` |
| Entrar al backend | `docker compose exec backend sh` |
| MongoDB shell | `docker compose exec mongodb mongosh -u admin -p edugrade2024` |
| Redis CLI | `docker compose exec redis redis-cli -a edugrade2024` |
| Cassandra CQL | `docker compose exec cassandra cqlsh` |

---

## Contacto y Soporte

Para problemas no cubiertos en esta guia:

1. Revisar los logs detallados: `docker compose logs`
2. Buscar en issues del repositorio
3. Crear un nuevo issue con:
   - Sistema operativo
   - Versiones de Docker y Docker Compose
   - Logs relevantes
   - Pasos para reproducir el problema
