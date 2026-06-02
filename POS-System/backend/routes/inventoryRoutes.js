const express = require('express');
const router = express.Router();
const { getAlertasInventario } = require('../controllers/inventoryController');

// 1. Importamos el middleware de seguridad de Víctor
const { verificarToken } = require('../middlewares/authMiddleware');

// 2. Ruta GET protegida: /api/inventory/alertas
router.get('/alertas', verificarToken, getAlertasInventario);

module.exports = router;