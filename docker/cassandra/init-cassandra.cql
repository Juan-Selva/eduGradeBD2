-- Script de inicializacion de Cassandra
-- Keyspace y tablas para auditoria y analitica

-- Crear keyspace
CREATE KEYSPACE IF NOT EXISTS edugrade
WITH replication = {
  'class': 'SimpleStrategy',
  'replication_factor': 1
};

USE edugrade;

-- ============================================
-- Tabla de eventos de auditoria (RF5)
-- Optimizada para escritura append-only
-- ============================================
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
AND compaction = {'class': 'TimeWindowCompactionStrategy', 'compaction_window_unit': 'DAYS', 'compaction_window_size': 1};

-- Indice secundario para busquedas por tipo
CREATE INDEX IF NOT EXISTS idx_tipo_evento ON eventos_auditoria (tipo_evento);
CREATE INDEX IF NOT EXISTS idx_entidad ON eventos_auditoria (entidad);
CREATE INDEX IF NOT EXISTS idx_usuario ON eventos_auditoria (usuario_id);

-- ============================================
-- Tabla de calificaciones historicas (RF4)
-- Para reportes analiticos masivos
-- ============================================
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

-- ============================================
-- Tabla de estadisticas agregadas por dia
-- Pre-calculadas para consultas rapidas
-- ============================================
CREATE TABLE IF NOT EXISTS estadisticas_diarias (
  pais TEXT,
  fecha DATE,
  total_calificaciones COUNTER,
  suma_valores COUNTER,
  total_aprobados COUNTER,
  total_desaprobados COUNTER,
  PRIMARY KEY (pais, fecha)
) WITH CLUSTERING ORDER BY (fecha DESC);

-- ============================================
-- Tabla de conversiones realizadas
-- ============================================
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
