const express = require('express');
const { db } = require('../config/db');
const router = express.Router();

const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) reject(err);
    else resolve(this);
  });
});
const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
});
const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const parseCategories = (categorias) => {
  if (!categorias) return [];
  if (Array.isArray(categorias)) return categorias.map(Number).filter(Boolean);
  return String(categorias).split(',').map(Number).filter(Boolean);
};

const sendError = (res, err, status = 500) => {
  console.error(err);
  res.status(status).json({ error: err.message || 'Error interno del servidor' });
};

router.get('/health', (req, res) => res.json({ ok: true, modulo: 'catalogo' }));

// ---------- PRODUCTOS ----------
router.get('/products', async (req, res) => {
  try {
    const search = `%${req.query.search || ''}%`;
    const rows = await all(`
      SELECT p.*, GROUP_CONCAT(c.nombre_categoria, ', ') AS categorias,
             GROUP_CONCAT(c.id_categoria) AS categoria_ids
      FROM Producto p
      LEFT JOIN Producto_Categoria pc ON pc.id_producto = p.id_producto AND pc.activo = 1
      LEFT JOIN Categoria c ON c.id_categoria = pc.id_categoria AND c.activo = 1
      WHERE p.activo = 1 AND (p.nombre LIKE ? OR IFNULL(p.codigo_barras, '') LIKE ? OR IFNULL(p.descripcion, '') LIKE ?)
      GROUP BY p.id_producto
      ORDER BY p.id_producto DESC
    `, [search, search, search]);
    res.json(rows);
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/products/barcode/:codigo', async (req, res) => {
  try {
    const row = await get('SELECT * FROM Producto WHERE codigo_barras = ? AND activo = 1', [req.params.codigo]);
    if (!row) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(row);
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const row = await get('SELECT * FROM Producto WHERE id_producto = ? AND activo = 1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Producto no encontrado' });
    row.categorias = await all(`
      SELECT c.id_categoria, c.nombre_categoria
      FROM Categoria c
      JOIN Producto_Categoria pc ON pc.id_categoria = c.id_categoria
      WHERE pc.id_producto = ? AND pc.activo = 1 AND c.activo = 1
    `, [req.params.id]);
    res.json(row);
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/products', async (req, res) => {
  const p = req.body;
  if (!p.nombre || p.precio_venta === undefined || p.precio_compra === undefined || !p.unidad_medida) {
    return res.status(400).json({ error: 'Nombre, precios y unidad de medida son obligatorios' });
  }
  try {
    await run('BEGIN TRANSACTION');
    const result = await run(`
      INSERT INTO Producto (codigo_barras, nombre, descripcion, precio_venta, precio_compra, stock, stock_minimo, unidad_medida, fecha_caducidad)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [p.codigo_barras || null, p.nombre, p.descripcion || null, Number(p.precio_venta), Number(p.precio_compra), Number(p.stock || 0), Number(p.stock_minimo || 5), p.unidad_medida, p.fecha_caducidad || null]);
    for (const idCategoria of parseCategories(p.categorias)) {
      await run('INSERT OR REPLACE INTO Producto_Categoria (id_producto, id_categoria, activo, fecha_modificacion) VALUES (?, ?, 1, CURRENT_TIMESTAMP)', [result.lastID, idCategoria]);
    }
    await run('COMMIT');
    res.status(201).json({ message: 'Producto creado correctamente', id_producto: result.lastID });
  } catch (err) {
    await run('ROLLBACK').catch(() => {});
    sendError(res, err, 400);
  }
});

router.put('/products/:id', async (req, res) => {
  const p = req.body;
  try {
    await run('BEGIN TRANSACTION');
    await run(`
      UPDATE Producto SET codigo_barras = ?, nombre = ?, descripcion = ?, precio_venta = ?, precio_compra = ?, stock = ?, stock_minimo = ?, unidad_medida = ?, fecha_caducidad = ?, fecha_modificacion = CURRENT_TIMESTAMP
      WHERE id_producto = ? AND activo = 1
    `, [p.codigo_barras || null, p.nombre, p.descripcion || null, Number(p.precio_venta), Number(p.precio_compra), Number(p.stock || 0), Number(p.stock_minimo || 5), p.unidad_medida, p.fecha_caducidad || null, req.params.id]);
    await run('UPDATE Producto_Categoria SET activo = 0, fecha_modificacion = CURRENT_TIMESTAMP WHERE id_producto = ?', [req.params.id]);
    for (const idCategoria of parseCategories(p.categorias)) {
      await run('INSERT OR REPLACE INTO Producto_Categoria (id_producto, id_categoria, activo, fecha_modificacion) VALUES (?, ?, 1, CURRENT_TIMESTAMP)', [req.params.id, idCategoria]);
    }
    await run('COMMIT');
    res.json({ message: 'Producto actualizado correctamente' });
  } catch (err) {
    await run('ROLLBACK').catch(() => {});
    sendError(res, err, 400);
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    await run('UPDATE Producto SET activo = 0, fecha_modificacion = CURRENT_TIMESTAMP WHERE id_producto = ?', [req.params.id]);
    await run('UPDATE Producto_Categoria SET activo = 0, fecha_modificacion = CURRENT_TIMESTAMP WHERE id_producto = ?', [req.params.id]);
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (err) {
    sendError(res, err);
  }
});

// ---------- CATEGORÍAS ----------
router.get('/categories', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM Categoria WHERE activo = 1 ORDER BY nombre_categoria ASC');
    res.json(rows);
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/categories', async (req, res) => {
  try {
    if (!req.body.nombre_categoria) return res.status(400).json({ error: 'El nombre de la categoría es obligatorio' });
    const result = await run('INSERT INTO Categoria (nombre_categoria, descripcion) VALUES (?, ?)', [req.body.nombre_categoria, req.body.descripcion || null]);
    res.status(201).json({ message: 'Categoría creada correctamente', id_categoria: result.lastID });
  } catch (err) {
    sendError(res, err, 400);
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    await run('UPDATE Categoria SET nombre_categoria = ?, descripcion = ? WHERE id_categoria = ? AND activo = 1', [req.body.nombre_categoria, req.body.descripcion || null, req.params.id]);
    res.json({ message: 'Categoría actualizada correctamente' });
  } catch (err) {
    sendError(res, err, 400);
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await run('UPDATE Categoria SET activo = 0 WHERE id_categoria = ?', [req.params.id]);
    await run('UPDATE Producto_Categoria SET activo = 0 WHERE id_categoria = ?', [req.params.id]);
    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
