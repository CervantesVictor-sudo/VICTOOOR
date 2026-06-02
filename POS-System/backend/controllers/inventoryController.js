const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// 1. Apuntamos directamente a la base de datos sin usar config/db.js
const dbPath = path.join(__dirname, '../database/TIENDA.db');

// 2. Creamos nuestra propia promesa local para consultar
const queryAllLocal = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        // Abrimos conexión local
        const db = new sqlite3.Database(dbPath);
        
        db.all(sql, params, (err, rows) => {
            db.close(); // Cerramos la conexión para no saturar la memoria
            if (err) reject(err);
            else resolve(rows || []); 
        });
    });
};

const getAlertasInventario = async (req, res) => {
    const queryStock = `SELECT id_producto, nombre, stock FROM Producto WHERE stock <= 5`;
    const queryCaducidad = `
        SELECT id_producto, nombre, fecha_caducidad 
        FROM Producto 
        WHERE fecha_caducidad <= date('now', '+7 days') 
        AND fecha_caducidad >= date('now')
    `;

    try {
        // 3. Ejecutamos las consultas de forma segura
        const bajoStock = await queryAllLocal(queryStock);
        const proximaCaducidad = await queryAllLocal(queryCaducidad);

        res.status(200).json({
            alertas: {
                stockCritico: bajoStock,
                caducidadProxima: proximaCaducidad
            }
        });

    } catch (error) {
        console.error("Error al consultar alertas de inventario:", error);
        res.status(500).json({ error: "Error interno del servidor al procesar el inventario." });
    }
};

module.exports = {
    getAlertasInventario
};