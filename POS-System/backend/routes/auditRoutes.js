/**
 * TAREA 4.1 — Rutas de Auditoría
 * Solo accesible para usuarios autenticados con rol admin o gerente.
 */

const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Todas las rutas requieren token JWT
router.get('/', verificarToken, auditController.listarAuditoria);
router.get('/:id', verificarToken, auditController.detalleAuditoria);

module.exports = router;
