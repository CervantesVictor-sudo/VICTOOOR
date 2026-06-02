const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { queryRun, queryGet, beginTransaction, commit, rollback } = require('../config/db');

// Promesa local segura para obtener múltiples registros (detalles de la compra)
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
    
    // Extraemos el id del usuario desde el token (el middleware lo inyecta en req.usuario)
    const id_usuario = req.usuario ? req.usuario.id_usuario : 1; 

    try {
        await beginTransaction();

        // 1. Validar que la compra exista
        const compra = await queryGet('SELECT estado FROM Compra WHERE id_compra = ?', [id_compra]);
        
        if (!compra) {
            await rollback();
            return res.status(404).json({ error: 'La orden de compra no existe.' });
        }
        
        // 2. Validar que no se reciba dos veces
        if (compra.estado === 'RECIBIDA') {
            await rollback();
            return res.status(400).json({ error: 'Esta compra ya fue marcada como RECIBIDA. El stock ya fue sumado anteriormente.' });
        }

        // 3. Cambiar el estado de la compra
        await queryRun("UPDATE Compra SET estado = 'RECIBIDA' WHERE id_compra = ?", [id_compra]);

        // 4. Obtener todos los productos de esta compra
        const detalles = await queryAllLocal('SELECT id_producto, cantidad FROM Detalle_Compras WHERE id_compra = ?', [id_compra]);

      // 5. Procesar cada producto para afectar el inventario
        for (const detalle of detalles) {
            // A. Registrar el movimiento de ENTRADA (sin la columna id_usuario)
            await queryRun(
                `INSERT INTO Movimiento_Inventario (id_producto, tipo_movimiento, cantidad, fecha_movimiento) 
                 VALUES (?, 'ENTRADA', ?, datetime('now', 'localtime'))`,
                [detalle.id_producto, detalle.cantidad]
            );

            // B. Sumar la cantidad al stock del Producto
            await queryRun(
                `UPDATE Producto SET stock = stock + ? WHERE id_producto = ?`,
                [detalle.cantidad, detalle.id_producto]
            );
        }

        // 6. Confirmar la transacción
        await commit();
        res.status(200).json({ message: 'Compra recibida exitosamente. El inventario ha sido actualizado.' });

    } catch (error) {
        await rollback();
        console.error('Error al procesar la recepción de la compra:', error);
        res.status(500).json({ error: 'Error interno al procesar el abastecimiento.' });
    }
};

module.exports = {
    recibirCompra
};