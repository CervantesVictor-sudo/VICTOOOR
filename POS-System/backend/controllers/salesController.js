const { queryRun, queryGet, beginTransaction, commit, rollback } = require('../config/db');

const procesarVenta = async (req, res) => {
    // 1. Extraemos los datos de la petición (del frontend) y del token (req.usuario)
    let { id_cliente, metodo_pago, descuento, productos } = req.body;
    const { id_usuario, id_empleado } = req.usuario; 

    // Validaciones iniciales
    if (!productos || productos.length === 0) {
        return res.status(400).json({ error: 'El carrito no puede estar vacío.' });
    }
    
    // Si no envían cliente, asignamos el cliente por defecto (público en general = ID 1)
    if (!id_cliente) id_cliente = 1;
    if (!descuento) descuento = 0;

    try {
        // ¡ARRANCA LA TRANSACCIÓN! A partir de aquí, o se guarda todo, o no se guarda nada.
        await beginTransaction();

        let subtotal = 0;
        let carritoProcesado = [];

        // 2. Iteramos los productos para validar stock y precios REALES en la BD
        for (const item of productos) {
            const productoDB = await queryGet('SELECT id_producto, nombre, precio_venta, stock FROM Producto WHERE id_producto = ? AND activo = 1', [item.id_producto]);
            
            if (!productoDB) {
                throw new Error(`El producto con ID ${item.id_producto} no existe o está inactivo.`);
            }

            // Regla de Negocio Crítica: Validación de Stock
            if (productoDB.stock < item.cantidad) {
                throw new Error(`Stock insuficiente para "${productoDB.nombre}". Solicitado: ${item.cantidad}, Disponible: ${productoDB.stock}`);
            }

            // Calculamos el costo de esta partida confiando SOLO en el backend
            const totalPartida = productoDB.precio_venta * item.cantidad;
            subtotal += totalPartida;

            // Guardamos la información limpia para usarla en el paso 4
            carritoProcesado.push({
                id_producto: productoDB.id_producto,
                cantidad: item.cantidad,
                precio_unitario: productoDB.precio_venta,
                total: totalPartida,
                nombre: productoDB.nombre 
            });
        }

        // 3. Cálculos finales (Asumiendo IVA del 16%)
        const impuestos = subtotal * 0.16;
        const total = (subtotal + impuestos) - descuento;

        if (total < 0) {
            throw new Error('El descuento no puede ser mayor al total de la venta.');
        }

        // 4. Insertar la cabecera de la Venta
        const venta = await queryRun(
            `INSERT INTO Venta (id_cliente, id_empleado, subtotal, impuestos, descuento, total, metodo_pago) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id_cliente, id_empleado, subtotal, impuestos, descuento, total, metodo_pago]
        );
        const id_venta = venta.lastID;

        // 5. Insertar Detalles, Restar Stock y Auditar POR CADA PRODUCTO
        for (const item of carritoProcesado) {
            // A) Detalle de venta
            await queryRun(
                `INSERT INTO Detalle_Ventas (id_venta, id_producto, cantidad, precio_unitario, total) 
                 VALUES (?, ?, ?, ?, ?)`,
                [id_venta, item.id_producto, item.cantidad, item.precio_unitario, item.total]
            );

            // B) Descontar Stock de forma segura
            await queryRun(
                `UPDATE Producto SET stock = stock - ?, fecha_modificacion = CURRENT_TIMESTAMP 
                 WHERE id_producto = ?`,
                [item.cantidad, item.id_producto]
            );

            // C) Registrar la salida en la Auditoría (Opcional pero excelente práctica)
            await queryRun(
                `INSERT INTO Auditoria (id_usuario, accion, tabla_afectada, registro_id) 
                 VALUES (?, ?, ?, ?)`,
                [id_usuario, `VENTA_SALIDA_STOCK: ${item.cantidad} unidades`, 'Producto', item.id_producto]
            );
        }

        // Auditar la venta general
        await queryRun(
            `INSERT INTO Auditoria (id_usuario, accion, tabla_afectada, registro_id) VALUES (?, ?, ?, ?)`,
            [id_usuario, 'REGISTRO_VENTA', 'Venta', id_venta]
        );

        // ¡SI LLEGAMOS AQUÍ SIN ERRORES, APROBAMOS LA TRANSACCIÓN!
        await commit();
        
        res.status(201).json({ 
            message: 'Venta procesada con éxito.', 
            id_venta: id_venta,
            total_pagado: total 
        });

    } catch (error) {
        // ¡REGLA DE ORO! Si algo falló (stock, db error, etc), revertimos TODO
        await rollback();
        console.error('Transacción abortada (Rollback aplicado):', error.message);
        
        // Retornamos 400 si fue un error de negocio (nuestro throw new Error), o 500 si fue fallo del servidor
        res.status(400).json({ error: error.message || 'Error interno al procesar la venta.' });
    }
};

module.exports = {
    procesarVenta
};