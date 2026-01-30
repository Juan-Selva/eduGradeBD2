# EduGrade Global

Sistema Nacional de Calificaciones Multimodelo para el Ministerio de Educacion.

## Arquitectura

El sistema utiliza **persistencia poliglota** con 4 bases de datos NoSQL, cada una seleccionada por su fortaleza especifica:

| Base de Datos | Modelo | Requerimiento | Justificacion |
|---------------|--------|---------------|---------------|
| **MongoDB** | Documentos | RF1 - Registro Academico | Esquema flexible para calificaciones heterogeneas de diferentes sistemas educativos |
| **Neo4j** | Grafos | RF3 - Relaciones Academicas | Modelado natural de equivalencias, trayectorias y correlatividades |
| **Cassandra** | Columnar | RF4/RF5 - Analitica/Auditoria | Escritura masiva append-only, consultas por rango temporal |
| **Redis** | Key-Value | RF2 - Conversiones | Cache de reglas de conversion frecuentes |

## Sistemas Educativos Soportados

- 🇬🇧 **Reino Unido (UK)**: A*, A, B, C, D, E, F / GCSE 1-9
- 🇺🇸 **Estados Unidos (US)**: Letter grades + GPA (0.0-4.0)
- 🇩🇪 **Alemania (DE)**: Escala 1.0-6.0 (1 = mejor)
- 🇦🇷 **Argentina (AR)**: Escala 1-10

## Estructura del Proyecto

```
edugrade-global/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuracion de bases de datos
│   │   ├── controllers/    # Controladores de API
│   │   ├── models/         # Modelos MongoDB
│   │   ├── routes/         # Rutas de la API
│   │   ├── services/       # Logica de negocio
│   │   ├── middlewares/    # Middlewares Express
│   │   └── utils/          # Utilidades
│   ├── Dockerfile
│   └── package.json
├── frontend/               # Frontend React (opcional)
├── docker/
│   ├── mongodb/           # Scripts inicializacion MongoDB
│   ├── neo4j/             # Configuracion Neo4j
│   └── cassandra/         # Scripts CQL
├── scripts/
│   └── load-million.js    # Script carga 1M registros
├── docs/                  # Documentacion tecnica (ver seccion abajo)
├── postman/               # Coleccion Postman
└── docker-compose.yml     # Orquestacion
```

## Inicio Rapido

### Prerrequisitos

- Docker y Docker Compose
- Node.js 18+ (para desarrollo local)

### 1. Levantar infraestructura

```bash
# Clonar/navegar al proyecto
cd edugrade-global

# Levantar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### 2. Verificar servicios

| Servicio | Puerto | URL |
|----------|--------|-----|
| Frontend React | 5173 | http://localhost:5173 |
| API Backend | 3000 | http://localhost:3000 |
| Swagger Docs | 3000 | http://localhost:3000/api-docs |
| MongoDB | 27017 | mongodb://localhost:27017 |
| Neo4j Browser | 7474 | http://localhost:7474 |
| Neo4j Bolt | 7687 | bolt://localhost:7687 |
| Cassandra | 9042 | localhost:9042 |
| Redis | 6379 | localhost:6379 |

### 3. Cargar datos de prueba (1M registros)

```bash
# Desde el directorio backend
cd backend
npm install
cp .env.example .env
npm run load-million
```

## API Endpoints

### Estudiantes
- `GET /api/estudiantes` - Listar estudiantes
- `GET /api/estudiantes/:id` - Obtener por ID
- `POST /api/estudiantes` - Crear estudiante
- `PUT /api/estudiantes/:id` - Actualizar
- `DELETE /api/estudiantes/:id` - Eliminar (soft)

### Calificaciones
- `GET /api/calificaciones` - Listar con filtros
- `GET /api/calificaciones/estudiante/:id` - Por estudiante
- `POST /api/calificaciones` - Registrar calificacion (inmutable)
- `POST /api/calificaciones/:id/corregir` - Corregir (nueva version)
- `GET /api/calificaciones/:id/verificar` - Verificar integridad
- `GET /api/calificaciones/:id/historial` - Historial versiones

### Conversiones
- `POST /api/conversiones/convertir` - Convertir entre sistemas
- `POST /api/conversiones/multiple` - Convertir a todos los sistemas
- `GET /api/conversiones/reglas` - Obtener reglas vigentes
- `GET /api/conversiones/tabla/:origen/:destino` - Tabla equivalencias

### Trayectorias (Neo4j)
- `GET /api/trayectorias/estudiante/:id` - Trayectoria completa
- `GET /api/trayectorias/equivalencias` - Equivalencias materias
- `POST /api/trayectorias/equivalencias` - Crear equivalencia
- `GET /api/trayectorias/camino/:id` - Grafo academico

### Reportes (Cassandra/MongoDB)
- `GET /api/reportes/promedio/pais` - Promedio por pais
- `GET /api/reportes/promedio/institucion` - Promedio por institucion
- `GET /api/reportes/distribucion` - Distribucion notas
- `GET /api/reportes/aprobacion` - Tasa aprobacion
- `GET /api/reportes/historico` - Comparacion historica
- `GET /api/reportes/top-materias` - Top 10 materias

### Auditoria (Cassandra)
- `GET /api/auditoria/eventos` - Eventos de auditoria
- `GET /api/auditoria/entidad/:tipo/:id` - Historial entidad
- `GET /api/auditoria/usuario/:id` - Acciones usuario
- `GET /api/auditoria/estadisticas` - Estadisticas

## Ejemplo de Uso

### Registrar calificacion (Argentina)

```bash
curl -X POST http://localhost:3000/api/calificaciones \
  -H "Content-Type: application/json" \
  -d '{
    "estudianteId": "...",
    "materiaId": "...",
    "institucionId": "...",
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
      "periodo": "anual"
    }
  }'
```

### Convertir calificacion UK -> AR

```bash
curl -X POST http://localhost:3000/api/conversiones/convertir \
  -H "Content-Type: application/json" \
  -d '{
    "sistemaOrigen": "UK",
    "sistemaDestino": "AR",
    "valorOriginal": {
      "uk": { "letra": "B" }
    }
  }'
```

**Respuesta:**
```json
{
  "sistemaOrigen": "UK",
  "sistemaDestino": "AR",
  "valorOriginal": { "uk": { "letra": "B" } },
  "valorNormalizado": 75,
  "valorConvertido": { "ar": { "nota": 8, "aprobado": true } },
  "reglaAplicada": "Normalizacion via escala 0-100"
}
```

## Analisis CAP

| Base | Consistencia | Disponibilidad | Tolerancia Particion | Trade-off |
|------|--------------|----------------|---------------------|-----------|
| MongoDB | Fuerte (replica set) | Alta | Si | CP |
| Neo4j | Fuerte | Alta | Limitada | CA |
| Cassandra | Eventual | Muy Alta | Si | AP |
| Redis | Eventual | Alta | Si | AP |

## Credenciales por Defecto

| Servicio | Usuario | Password |
|----------|---------|----------|
| MongoDB | admin | edugrade2024 |
| Neo4j | neo4j | edugrade2024 |
| Redis | - | edugrade2024 |

## Desarrollo Local

```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend (opcional)
cd frontend
npm install
npm run dev
```

## Documentacion

La documentacion tecnica completa se encuentra en la carpeta `/docs`:

| Documento | Descripcion |
|-----------|-------------|
| [01-ARQUITECTURA-GENERAL.md](./docs/01-ARQUITECTURA-GENERAL.md) | Vision general del sistema, problema y solucion |
| [02-DOCKER-Y-CONTENEDORES.md](./docs/02-DOCKER-Y-CONTENEDORES.md) | Configuracion de infraestructura Docker |
| [03-BASES-DE-DATOS.md](./docs/03-BASES-DE-DATOS.md) | Esquemas y configuracion de las 4 bases de datos |
| [03-A-DECISIONES-BASES-DE-DATOS.md](./docs/03-A-DECISIONES-BASES-DE-DATOS.md) | **Justificacion de eleccion de BDs**, ventajas/desventajas, matriz de decision |
| [04-BACKEND-API.md](./docs/04-BACKEND-API.md) | Documentacion de endpoints y servicios |
| [05-FRONTEND.md](./docs/05-FRONTEND.md) | Guia de React y componentes |
| [06-GUIA-INSTALACION.md](./docs/06-GUIA-INSTALACION.md) | Instrucciones de setup completas |

## Licencia

MIT
