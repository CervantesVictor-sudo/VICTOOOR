const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', '..', 'database', 'TIENDA.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Error al conectar con TIENDA.db:', err.message);
  else console.log('Base de datos conectada:', dbPath);
});

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');
});

module.exports = db;
