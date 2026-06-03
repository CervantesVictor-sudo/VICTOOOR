/**
 * TAREA 4.2 — Rutas de Reportes e Inteligencia de Negocios
 * Todas las rutas requieren autenticación JWT.
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Dashboard KPIs generales
router.get('/kpis', verificarToken, reportController.getKPIs);

// Ventas agrupadas por día (para gráfica de tendencia)
router.get('/ventas-por-dia', verificarToken, reportController.getVentasPorDia);

// Distribución por método de pago
router.get('/ventas-por-metodo', verificarToken, reportController.getVentasPorMetodo);

// Ranking de productos más vendidos + margen bruto
router.get('/top-productos', verificarToken, reportController.getTopProductos);

// Rendimiento por empleado/cajero
router.get('/ventas-por-empleado', verificarToken, reportController.getVentasPorEmpleado);

// Movimientos de inventario (entradas/salidas)
router.get('/movimientos-inventario', verificarToken, reportController.getMovimientosInventario);

module.exports = router;
