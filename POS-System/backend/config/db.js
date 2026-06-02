const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Aseguramos la ruta absoluta hacia la base de datos
const dbPath = path.join(__dirname, '../database/TIENDA.db');

// Inicializamos la conexión única a SQLite
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
