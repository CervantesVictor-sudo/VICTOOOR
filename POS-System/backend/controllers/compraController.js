/**
 * TAREA 4.1 — compraController.js MODIFICADO
 * Cambios: Se agregó registrarAccion() con datos_previos/datos_nuevos del stock
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { queryRun, queryGet, beginTransaction, commit, rollback } = require('../config/db');
const { registrarAccion } = require('../utils/auditService'); // ← NUEVO

const dbPath = path.join(__dirname, '../database/TIENDA.db');
const queryAllLocal = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath);
        db.all(sql, params, (err, rows) => {
            db.close();
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
};

const recibirCompra = async (req, res) => {
    const { id_compra } = req.params;
    const id_usuario = req.usuario ? req.usuario.id_usuario : 1; 

    try {
        await beginTransaction();

        const compra = await queryGet('SELECT * FROM Compra WHERE id_compra = ?', [id_compra]);
        
        if (!compra) {
            await rollback();
            return res.status(404).json({ error: 'La orden de compra no existe.' });
        }
        
        if (compra.estado === 'RECIBIDA') {
            await rollback();
            return res.status(400).json({ error: 'Esta compra ya fue marcada como RECIBIDA.' });
        }

        // ← NUEVO: Capturar estado previo
        const estadoPrevio = compra.estado;

        await queryRun("UPDATE Compra SET estado = 'RECIBIDA' WHERE id_compra = ?", [id_compra]);

        const detalles = await queryAllLocal('SELECT id_producto, cantidad FROM Detalle_Compras WHERE id_compra = ?', [id_compra]);

        const stockChanges = []; // ← NUEVO: para auditoría

        for (const detalle of detalles) {
            // ← NUEVO: Capturar stock antes
            const productoBD = await queryGet('SELECT nombre, stock FROM Producto WHERE id_producto = ?', [detalle.id_producto]);
            const stockAntes = productoBD ? productoBD.stock : 0;

            await queryRun(
                `INSERT INTO Movimiento_Inventario (id_producto, tipo_movimiento, cantidad, fecha_movimiento) 
                 VALUES (?, 'ENTRADA', ?, datetime('now', 'localtime'))`,
                [detalle.id_producto, detalle.cantidad]
            );

            await queryRun(
                `UPDATE Producto SET stock = stock + ? WHERE id_producto = ?`,
                [detalle.cantidad, detalle.id_producto]
            );

            stockChanges.push({
                producto: productoBD ? productoBD.nombre : `ID ${detalle.id_producto}`,
                stock_antes: stockAntes,
                stock_despues: stockAntes + detalle.cantidad,
                cantidad_entrada: detalle.cantidad
            });
        }

        // ← AUDITORÍA MEJORADA
        await registrarAccion({
            idUsuario: id_usuario,
            accion: 'RECIBIR_COMPRA',
            tablaAfectada: 'Compra',
            registroId: parseInt(id_compra),
            datosPrevios: { estado: estadoPrevio, stock_productos: stockChanges.map(s => ({ producto: s.producto, stock: s.stock_antes })) },
            datosNuevos: { estado: 'RECIBIDA', stock_actualizado: stockChanges },
            observaciones: `Compra #${id_compra} recibida — ${detalles.length} productos ingresados al inventario`
        });

        await commit();
        res.status(200).json({ message: 'Compra recibida exitosamente. El inventario ha sido actualizado.' });

    } catch (error) {
        await rollback();
        console.error('Error al procesar la recepción de la compra:', error);
        res.status(500).json({ error: 'Error interno al procesar el abastecimiento.' });
    }
};

module.exports = { recibirCompra };
