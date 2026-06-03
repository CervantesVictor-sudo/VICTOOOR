/**
 * =============================================
 * TAREA 4.1 — Servicio Centralizado de Auditoría
 * =============================================
 * 
 * IMPORTANTE: Este módulo usa queryRun de config/db.js (async/Promesas)
 * para ser 100% compatible con el patrón del proyecto.
 * 
 * USO DENTRO DE UNA TRANSACCIÓN (recomendado):
 *   await beginTransaction();
 *   try {
 *     // ... operación principal ...
 *     await registrarAccion({
 *       idUsuario: req.usuario.id_usuario,
 *       accion: 'CREAR',
 *       tablaAfectada: 'Producto',
 *       registroId: nuevoId,
 *       datosPrevios: null,
 *       datosNuevos: { nombre: 'Sabritas', precio: 18.50 },
 *       observaciones: 'Producto creado desde catálogo'
 *     });
 *     await commit();
 *   } catch (error) {
 *     await rollback();
 *   }
 */

const { queryRun } = require('../config/db');

/**
 * Registra una acción en la bitácora de auditoría.
 * 
 * @param {Object}      opts
 * @param {number|null}  opts.idUsuario      - ID del usuario que ejecuta (null para sistema)
 * @param {string}       opts.accion         - Tipo: LOGIN, CREAR, EDITAR, ELIMINAR, VENTA, CANCELAR, AJUSTE, MERMA, etc.
 * @param {string}       opts.tablaAfectada  - Tabla/entidad: Producto, Venta, Usuario, Inventario, etc.
 * @param {number|null}  opts.registroId     - PK del registro afectado
 * @param {Object|null}  opts.datosPrevios   - Snapshot JSON del estado ANTES de la operación
 * @param {Object|null}  opts.datosNuevos    - Snapshot JSON del estado DESPUÉS de la operación
 * @param {string|null}  opts.observaciones  - Texto libre / motivo / contexto adicional
 */
const registrarAccion = async ({
    idUsuario,
    accion,
    tablaAfectada,
    registroId = null,
    datosPrevios = null,
    datosNuevos = null,
    observaciones = null
}) => {
    try {
        const prevJson = datosPrevios ? JSON.stringify(datosPrevios) : null;
        const nuevoJson = datosNuevos ? JSON.stringify(datosNuevos) : null;

        await queryRun(
            `INSERT INTO Auditoria 
                (id_usuario, accion, tabla_afectada, registro_id, datos_previos, datos_nuevos, observaciones) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [idUsuario || null, accion, tablaAfectada, registroId, prevJson, nuevoJson, observaciones]
        );
    } catch (error) {
        // La auditoría NUNCA debe romper la operación principal.
        // Si estamos dentro de una transacción y falla, el error se propaga
        // y el rollback del controlador lo atrapa.
        console.error('[AUDITORIA] Error al registrar:', error.message);
        throw error; // Re-lanzamos para que el rollback lo atrape
    }
};

/**
 * Captura un snapshot limpio de un objeto/fila de la BD.
 * Excluye campos sensibles como password_hash.
 * 
 * @param {Object|null} row      - Fila de la base de datos
 * @param {string[]}    exclude  - Campos a excluir (default: ['password_hash'])
 * @returns {Object|null}
 */
const snapshot = (row, exclude = ['password_hash']) => {
    if (!row) return null;
    const copy = { ...row };
    exclude.forEach(key => delete copy[key]);
    return copy;
};

module.exports = { registrarAccion, snapshot };
