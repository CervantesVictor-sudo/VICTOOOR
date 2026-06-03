-- =============================================
-- TAREA 4.1: Migración de tabla Auditoria
-- Ejecutar en la base de datos TIENDA.db
-- =============================================

-- 1. Agregar columnas nuevas (si no existen)
--    SQLite no tiene IF NOT EXISTS para ALTER TABLE,
--    así que estos comandos darán error si ya existen (es normal, ignorar).

ALTER TABLE Auditoria ADD COLUMN datos_previos TEXT;
ALTER TABLE Auditoria ADD COLUMN datos_nuevos TEXT;
ALTER TABLE Auditoria ADD COLUMN observaciones TEXT;

-- 2. Renombrar columna para consistencia (opcional, solo si quieres)
--    Si prefieres mantener 'tabla_afectada' y 'registro_id', no ejecutes esto
--    y ajusta el servicio de auditoría para usar esos nombres.
-- ALTER TABLE Auditoria RENAME COLUMN tabla_afectada TO entidad_afectada;
-- ALTER TABLE Auditoria RENAME COLUMN registro_id TO id_entidad;

-- 3. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON Auditoria(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON Auditoria(id_usuario);
CREATE INDEX IF NOT EXISTS idx_auditoria_accion ON Auditoria(accion);

-- 4. Triggers de INMUTABILIDAD
--    Una vez insertado un registro, NADIE puede modificarlo ni borrarlo.
CREATE TRIGGER IF NOT EXISTS auditoria_no_update
BEFORE UPDATE ON Auditoria
BEGIN
  SELECT RAISE(ABORT, 'Los registros de auditoria son inmutables y no pueden modificarse');
END;

CREATE TRIGGER IF NOT EXISTS auditoria_no_delete
BEFORE DELETE ON Auditoria
BEGIN
  SELECT RAISE(ABORT, 'Los registros de auditoria son inmutables y no pueden eliminarse');
END;
