const path = require('path');
const sqlite3 = require('sqlite3').verbose();
<<<<<<< HEAD

const dbPath = path.join(__dirname, '..', '..', 'database', 'TIENDA.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Error al conectar con TIENDA.db:', err.message);
  else console.log('Base de datos conectada:', dbPath);
});

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');
});

module.exports = db;
=======
const path = require('path');

// Aseguramos la ruta absoluta hacia la base de datos
const dbPath = path.join(__dirname, '../database/TIENDA.db');

// Inicializamos la conexión a SQLite
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos TIENDA.db:', err.message);
    } else {
        console.log('Conexión exitosa a la base de datos SQLite.');
        // Activamos las llaves foráneas por seguridad referencial
        db.run('PRAGMA foreign_keys = ON');
    }
});

/**
 * ENVOLTURAS (WRAPPERS) CON PROMESAS
 * Estas funciones reemplazan el uso de callbacks por Promesas,
 * permitiendo el uso limpio de async/await en los controladores.
 */

const queryRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this); // 'this' contiene lastID y changes
        });
    });
};

const queryGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const queryAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

/**
 * CONTROLADORES TRANSACCIONALES
 * Fundamentales para garantizar la integridad de los datos en
 * operaciones de Ventas, Compras y Movimientos de Inventario.
 */

const beginTransaction = () => queryRun('BEGIN TRANSACTION');
const commit = () => queryRun('COMMIT');
const rollback = () => queryRun('ROLLBACK');

module.exports = {
    db, // Exportamos la instancia original por si se requiere
    queryRun,
    queryGet,
    queryAll,
    beginTransaction,
    commit,
    rollback
};

/* =====================================================================
 * EJEMPLO DE USO PARA EL EQUIPO (Pueden borrar esto después de leerlo)
 * =====================================================================
 * * Este es el patrón estándar que todos deben usar en sus controladores
 * (controllers) para operaciones que modifican más de una tabla a la vez.
 * * const { queryRun, beginTransaction, commit, rollback } = require('../config/db');
 * * const procesarVentaCompleja = async (req, res) => {
 * try {
 * // 1. Iniciamos la transacción (Bloquea los datos para mantener integridad)
 * await beginTransaction();
 * * // 2. Ejecutamos las consultas secuenciales
 * const venta = await queryRun(
 * 'INSERT INTO Ventas (id_cliente, id_empleado, total) VALUES (?, ?, ?)', 
 * [1, 2, 500.00]
 * );
 * * await queryRun(
 * 'UPDATE Producto SET stock = stock - ? WHERE id_producto = ?',
 * [2, 10]
 * );
 * * // 3. Si todo salió perfecto, consolidamos los cambios en la DB
 * await commit();
 * res.status(200).json({ message: 'Venta procesada con éxito', idVenta: venta.lastID });
 * * } catch (error) {
 * // 4. Si CUALQUIER consulta falla, deshacemos TODO lo hecho en este bloque
 * await rollback();
 * console.error('Error en la transacción, aplicando rollback:', error);
 * res.status(500).json({ error: 'Fallo al procesar la operación.' });
 * }
 * };
 * =====================================================================
 */
>>>>>>> 1634d6ea6c4eafb5ab6b8e0e55786bd4f56b814c
