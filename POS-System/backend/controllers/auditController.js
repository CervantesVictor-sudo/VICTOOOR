/**
 * TAREA 4.1 — Controlador de Auditoría
 * Endpoints para consultar la bitácora desde el panel de administración.
 */

const { queryAll, queryGet } = require('../config/db');

/**
 * GET /api/auditoria
 * Lista paginada con filtros por fecha, usuario, acción y entidad.
 */
const listarAuditoria = async (req, res) => {
    const { from, to, accion, entidad, usuario, page = 1, limit = 30 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(parseInt(limit) || 30, 200);
    const offset = (pageNum - 1) * limitNum;

    try {
        let whereSql = '';
        const conds = [];
        const params = [];

        if (from) { conds.push('a.fecha_hora >= ?'); params.push(from); }
        if (to) { conds.push("a.fecha_hora <= ? || ' 23:59:59'"); params.push(to); }
        if (accion) { conds.push('a.accion LIKE ?'); params.push(`%${accion}%`); }
        if (entidad) { conds.push('a.tabla_afectada LIKE ?'); params.push(`%${entidad}%`); }
        if (usuario) { conds.push('u.username LIKE ?'); params.push(`%${usuario}%`); }

        if (conds.length) whereSql = ' WHERE ' + conds.join(' AND ');

        // Contar total para paginación
        const countRow = await queryGet(
            `SELECT COUNT(*) as total FROM Auditoria a LEFT JOIN Usuario u ON a.id_usuario = u.id_usuario${whereSql}`,
            params
        );
        const total = countRow ? countRow.total : 0;

        // Obtener registros paginados
        const rows = await queryAll(
            `SELECT a.*, u.username 
             FROM Auditoria a LEFT JOIN Usuario u ON a.id_usuario = u.id_usuario
             ${whereSql}
             ORDER BY a.fecha_hora DESC 
             LIMIT ? OFFSET ?`,
            [...params, limitNum, offset]
        );

        res.json({
            data: rows,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Error al consultar auditoría:', error);
        res.status(500).json({ error: 'Error interno al consultar la bitácora.' });
    }
};

/**
 * GET /api/auditoria/:id
 * Detalle de un registro individual (incluye datos_previos y datos_nuevos).
 */
const detalleAuditoria = async (req, res) => {
    try {
        const row = await queryGet(
            `SELECT a.*, u.username 
             FROM Auditoria a LEFT JOIN Usuario u ON a.id_usuario = u.id_usuario
             WHERE a.id_auditoria = ?`,
            [req.params.id]
        );

        if (!row) return res.status(404).json({ error: 'Registro de auditoría no encontrado.' });

        // Parsear JSON para comodidad del frontend
        try { row.datos_previos_parsed = row.datos_previos ? JSON.parse(row.datos_previos) : null; } catch (_) {}
        try { row.datos_nuevos_parsed = row.datos_nuevos ? JSON.parse(row.datos_nuevos) : null; } catch (_) {}

        res.json(row);
    } catch (error) {
        console.error('Error al consultar detalle de auditoría:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

module.exports = {
    listarAuditoria,
    detalleAuditoria
};
