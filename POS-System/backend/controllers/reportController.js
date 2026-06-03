/**
 * =============================================
 * TAREA 4.2 — Controlador de Reportes e Inteligencia de Negocios
 * Responsable: Martin
 * =============================================
 * 
 * Endpoints para el Dashboard Gerencial:
 *  - KPIs generales
 *  - Ventas por periodo (día/semana/mes)
 *  - Ventas por método de pago
 *  - Ranking de productos más vendidos con margen bruto
 *  - Resumen de inventario y movimientos
 */

const { queryAll, queryGet } = require('../config/db');

// ─────────────────────────────────────────
// GET /api/reportes/kpis?from=&to=
// KPIs principales del negocio
// ─────────────────────────────────────────
const getKPIs = async (req, res) => {
    const from = req.query.from || '2000-01-01';
    const to = req.query.to || '2099-12-31';

    try {
        // Ventas completadas en el periodo
        const ventas = await queryGet(`
            SELECT 
                COUNT(*) as total_ventas,
                COALESCE(SUM(total), 0) as ingresos_totales,
                COALESCE(AVG(total), 0) as ticket_promedio,
                COALESCE(SUM(descuento), 0) as descuentos_totales,
                COALESCE(SUM(impuestos), 0) as impuestos_totales
            FROM Venta 
            WHERE estado = 'COMPLETADA'
              AND fecha_venta >= ? 
              AND fecha_venta <= ? || ' 23:59:59'
        `, [from, to]);

        // Total de productos vendidos (unidades)
        const unidades = await queryGet(`
            SELECT COALESCE(SUM(dv.cantidad), 0) as unidades_vendidas
            FROM Detalle_Ventas dv
            JOIN Venta v ON dv.id_venta = v.id_venta
            WHERE v.estado = 'COMPLETADA'
              AND v.fecha_venta >= ?
              AND v.fecha_venta <= ? || ' 23:59:59'
        `, [from, to]);

        // Margen bruto estimado
        const margen = await queryGet(`
            SELECT 
                COALESCE(SUM(dv.cantidad * dv.precio_unitario), 0) as ingreso_productos,
                COALESCE(SUM(dv.cantidad * p.precio_compra), 0) as costo_productos
            FROM Detalle_Ventas dv
            JOIN Venta v ON dv.id_venta = v.id_venta
            JOIN Producto p ON dv.id_producto = p.id_producto
            WHERE v.estado = 'COMPLETADA'
              AND v.fecha_venta >= ?
              AND v.fecha_venta <= ? || ' 23:59:59'
        `, [from, to]);

        const margenBruto = (margen.ingreso_productos || 0) - (margen.costo_productos || 0);

        // Productos en stock crítico
        const stockCritico = await queryGet(`
            SELECT COUNT(*) as total FROM Producto WHERE activo = 1 AND stock <= stock_minimo
        `);

        // Ventas de hoy
        const hoy = new Date().toISOString().split('T')[0];
        const ventasHoy = await queryGet(`
            SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as ingresos
            FROM Venta WHERE estado = 'COMPLETADA' AND fecha_venta >= ?
        `, [hoy]);

        res.json({
            total_ventas: ventas.total_ventas,
            ingresos_totales: parseFloat(ventas.ingresos_totales).toFixed(2),
            ticket_promedio: parseFloat(ventas.ticket_promedio).toFixed(2),
            descuentos_totales: parseFloat(ventas.descuentos_totales).toFixed(2),
            impuestos_totales: parseFloat(ventas.impuestos_totales).toFixed(2),
            unidades_vendidas: unidades.unidades_vendidas,
            margen_bruto: parseFloat(margenBruto).toFixed(2),
            porcentaje_margen: ventas.ingresos_totales > 0
                ? ((margenBruto / ventas.ingresos_totales) * 100).toFixed(1)
                : '0.0',
            stock_critico: stockCritico.total,
            ventas_hoy: ventasHoy.total,
            ingresos_hoy: parseFloat(ventasHoy.ingresos).toFixed(2)
        });
    } catch (error) {
        console.error('Error en KPIs:', error);
        res.status(500).json({ error: 'Error al calcular KPIs.' });
    }
};

// ─────────────────────────────────────────
// GET /api/reportes/ventas-por-dia?from=&to=
// Ventas agrupadas por día
// ─────────────────────────────────────────
const getVentasPorDia = async (req, res) => {
    const from = req.query.from || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const to = req.query.to || new Date().toISOString().split('T')[0];

    try {
        const rows = await queryAll(`
            SELECT 
                date(fecha_venta) as dia,
                COUNT(*) as num_ventas,
                COALESCE(SUM(total), 0) as ingresos
            FROM Venta
            WHERE estado = 'COMPLETADA'
              AND fecha_venta >= ?
              AND fecha_venta <= ? || ' 23:59:59'
            GROUP BY date(fecha_venta)
            ORDER BY dia ASC
        `, [from, to]);

        res.json(rows);
    } catch (error) {
        console.error('Error en ventas por día:', error);
        res.status(500).json({ error: 'Error al consultar ventas por día.' });
    }
};

// ─────────────────────────────────────────
// GET /api/reportes/ventas-por-metodo?from=&to=
// Distribución por método de pago
// ─────────────────────────────────────────
const getVentasPorMetodo = async (req, res) => {
    const from = req.query.from || '2000-01-01';
    const to = req.query.to || '2099-12-31';

    try {
        const rows = await queryAll(`
            SELECT 
                metodo_pago,
                COUNT(*) as num_ventas,
                COALESCE(SUM(total), 0) as ingresos
            FROM Venta
            WHERE estado = 'COMPLETADA'
              AND fecha_venta >= ?
              AND fecha_venta <= ? || ' 23:59:59'
            GROUP BY metodo_pago
            ORDER BY ingresos DESC
        `, [from, to]);

        res.json(rows);
    } catch (error) {
        console.error('Error en ventas por método:', error);
        res.status(500).json({ error: 'Error al consultar ventas por método de pago.' });
    }
};

// ─────────────────────────────────────────
// GET /api/reportes/top-productos?from=&to=&limit=
// Ranking de productos más vendidos con margen bruto
// ─────────────────────────────────────────
const getTopProductos = async (req, res) => {
    const from = req.query.from || '2000-01-01';
    const to = req.query.to || '2099-12-31';
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);

    try {
        const rows = await queryAll(`
            SELECT 
                p.id_producto,
                p.nombre,
                p.codigo_barras,
                p.precio_venta,
                p.precio_compra,
                p.stock,
                SUM(dv.cantidad) as unidades_vendidas,
                SUM(dv.total) as ingreso_total,
                SUM(dv.cantidad * p.precio_compra) as costo_total,
                SUM(dv.total) - SUM(dv.cantidad * p.precio_compra) as margen_bruto,
                CASE 
                    WHEN SUM(dv.total) > 0 
                    THEN ROUND(((SUM(dv.total) - SUM(dv.cantidad * p.precio_compra)) / SUM(dv.total)) * 100, 1)
                    ELSE 0 
                END as porcentaje_margen
            FROM Detalle_Ventas dv
            JOIN Producto p ON dv.id_producto = p.id_producto
            JOIN Venta v ON dv.id_venta = v.id_venta
            WHERE v.estado = 'COMPLETADA'
              AND v.fecha_venta >= ?
              AND v.fecha_venta <= ? || ' 23:59:59'
            GROUP BY p.id_producto
            ORDER BY unidades_vendidas DESC
            LIMIT ?
        `, [from, to, limit]);

        res.json(rows);
    } catch (error) {
        console.error('Error en top productos:', error);
        res.status(500).json({ error: 'Error al consultar ranking de productos.' });
    }
};

// ─────────────────────────────────────────
// GET /api/reportes/ventas-por-empleado?from=&to=
// Rendimiento por empleado/cajero
// ─────────────────────────────────────────
const getVentasPorEmpleado = async (req, res) => {
    const from = req.query.from || '2000-01-01';
    const to = req.query.to || '2099-12-31';

    try {
        const rows = await queryAll(`
            SELECT 
                e.id_empleado,
                e.nombre as empleado,
                e.puesto,
                COUNT(v.id_venta) as num_ventas,
                COALESCE(SUM(v.total), 0) as ingresos,
                COALESCE(AVG(v.total), 0) as ticket_promedio
            FROM Venta v
            JOIN Empleado e ON v.id_empleado = e.id_empleado
            WHERE v.estado = 'COMPLETADA'
              AND v.fecha_venta >= ?
              AND v.fecha_venta <= ? || ' 23:59:59'
            GROUP BY e.id_empleado
            ORDER BY ingresos DESC
        `, [from, to]);

        res.json(rows);
    } catch (error) {
        console.error('Error en ventas por empleado:', error);
        res.status(500).json({ error: 'Error al consultar rendimiento por empleado.' });
    }
};

// ─────────────────────────────────────────
// GET /api/reportes/movimientos-inventario?from=&to=&tipo=
// Resumen de movimientos de inventario
// ─────────────────────────────────────────
const getMovimientosInventario = async (req, res) => {
    const from = req.query.from || '2000-01-01';
    const to = req.query.to || '2099-12-31';
    const tipo = req.query.tipo; // ENTRADA o SALIDA

    try {
        let sql = `
            SELECT 
                mi.id_movimiento,
                p.nombre as producto,
                p.codigo_barras,
                mi.tipo_movimiento,
                mi.cantidad,
                mi.fecha_movimiento
            FROM Movimiento_Inventario mi
            JOIN Producto p ON mi.id_producto = p.id_producto
            WHERE mi.fecha_movimiento >= ?
              AND mi.fecha_movimiento <= ? || ' 23:59:59'
        `;
        const params = [from, to];

        if (tipo && ['ENTRADA', 'SALIDA'].includes(tipo)) {
            sql += ' AND mi.tipo_movimiento = ?';
            params.push(tipo);
        }

        sql += ' ORDER BY mi.fecha_movimiento DESC LIMIT 200';

        const rows = await queryAll(sql, params);

        // Resumen agregado
        const resumen = await queryAll(`
            SELECT 
                tipo_movimiento,
                COUNT(*) as total_movimientos,
                SUM(cantidad) as total_unidades
            FROM Movimiento_Inventario
            WHERE fecha_movimiento >= ?
              AND fecha_movimiento <= ? || ' 23:59:59'
            GROUP BY tipo_movimiento
        `, [from, to]);

        res.json({ movimientos: rows, resumen });
    } catch (error) {
        console.error('Error en movimientos de inventario:', error);
        res.status(500).json({ error: 'Error al consultar movimientos.' });
    }
};

module.exports = {
    getKPIs,
    getVentasPorDia,
    getVentasPorMetodo,
    getTopProductos,
    getVentasPorEmpleado,
    getMovimientosInventario
};
