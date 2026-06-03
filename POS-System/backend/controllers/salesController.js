/**
 * TAREA 4.1 — salesController.js MODIFICADO
 * Cambios: Se reemplazaron los INSERT manuales a Auditoria por registrarAccion()
 *          con datos_previos (stock antes) y datos_nuevos (stock después, detalle venta)
 */

const { queryRun, queryGet, beginTransaction, commit, rollback } = require('../config/db');
const { registrarAccion } = require('../utils/auditService'); // ← NUEVO

const procesarVenta = async (req, res) => {
    let { id_cliente, metodo_pago, descuento, productos } = req.body;
    const { id_usuario, id_empleado } = req.usuario; 

    if (!productos || productos.length === 0) {
        return res.status(400).json({ error: 'El carrito no puede estar vacío.' });
    }
    
    if (!id_cliente) id_cliente = 1;
    if (!descuento) descuento = 0;

    try {
        await beginTransaction();

        let subtotal = 0;
        let carritoProcesado = [];
        let stockChanges = []; // ← NUEVO: para auditoría

        for (const item of productos) {
            const productoDB = await queryGet('SELECT id_producto, nombre, precio_venta, stock FROM Producto WHERE id_producto = ? AND activo = 1', [item.id_producto]);
            
            if (!productoDB) {
                throw new Error(`El producto con ID ${item.id_producto} no existe o está inactivo.`);
            }

            if (productoDB.stock < item.cantidad) {
                throw new Error(`Stock insuficiente para "${productoDB.nombre}". Solicitado: ${item.cantidad}, Disponible: ${productoDB.stock}`);
            }

            const totalPartida = productoDB.precio_venta * item.cantidad;
            subtotal += totalPartida;

            carritoProcesado.push({
                id_producto: productoDB.id_producto,
                cantidad: item.cantidad,
                precio_unitario: productoDB.precio_venta,
                total: totalPartida,
                nombre: productoDB.nombre 
            });

            // ← NUEVO: Capturar cambios de stock para auditoría
            stockChanges.push({
                producto: productoDB.nombre,
                stock_antes: productoDB.stock,
                stock_despues: productoDB.stock - item.cantidad,
                cantidad_vendida: item.cantidad
            });
        }

        const impuestos = subtotal * 0.16;
        const total = (subtotal + impuestos) - descuento;

        if (total < 0) {
            throw new Error('El descuento no puede ser mayor al total de la venta.');
        }

        const venta = await queryRun(
            `INSERT INTO Venta (id_cliente, id_empleado, subtotal, impuestos, descuento, total, metodo_pago) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id_cliente, id_empleado, subtotal, impuestos, descuento, total, metodo_pago]
        );
        const id_venta = venta.lastID;

        for (const item of carritoProcesado) {
            await queryRun(
                `INSERT INTO Detalle_Ventas (id_venta, id_producto, cantidad, precio_unitario, total) 
                 VALUES (?, ?, ?, ?, ?)`,
                [id_venta, item.id_producto, item.cantidad, item.precio_unitario, item.total]
            );

            await queryRun(
                `UPDATE Producto SET stock = stock - ?, fecha_modificacion = CURRENT_TIMESTAMP 
                 WHERE id_producto = ?`,
                [item.cantidad, item.id_producto]
            );
        }

        // ← AUDITORÍA MEJORADA: Una sola entrada con toda la información
        await registrarAccion({
            idUsuario: id_usuario,
            accion: 'VENTA',
            tablaAfectada: 'Venta',
            registroId: id_venta,
            datosPrevios: { stock_productos: stockChanges.map(s => ({ producto: s.producto, stock: s.stock_antes })) },
            datosNuevos: {
                id_venta,
                total: total.toFixed(2),
                metodo_pago,
                productos: carritoProcesado.length,
                stock_productos: stockChanges.map(s => ({ producto: s.producto, stock: s.stock_despues }))
            },
            observaciones: `Venta #${id_venta} — $${total.toFixed(2)} — ${metodo_pago} — ${carritoProcesado.length} productos`
        });

        await commit();
        
        res.status(201).json({ 
            message: 'Venta procesada con éxito.', 
            id_venta: id_venta,
            total_pagado: total 
        });

    } catch (error) {
        await rollback();
        console.error('Transacción abortada (Rollback aplicado):', error.message);
        res.status(400).json({ error: error.message || 'Error interno al procesar la venta.' });
    }
};

module.exports = { procesarVenta };
