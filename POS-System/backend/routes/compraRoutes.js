const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compraController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Ruta PUT para transicionar el estado de la compra (Requiere token JWT)
router.put('/:id_compra/recibir', verificarToken, compraController.recibirCompra);

module.exports = router;