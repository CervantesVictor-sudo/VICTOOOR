const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Endpoint para procesar la venta del carrito
// Se protege con verificarToken para saber qué usuario/empleado hace la venta
router.post('/procesar', verificarToken, salesController.procesarVenta);

module.exports = router;