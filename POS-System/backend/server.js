const express = require('express');
const cors = require('cors');
const app = express();
 
// 1. Importación de Rutas (solo las que YA EXISTEN en tu repo)
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const salesRoutes = require('./routes/salesRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const compraRoutes = require('./routes/compraRoutes');
 
// Importaciones opcionales: solo si el archivo existe
let auditRoutes, reportRoutes;
try { auditRoutes = require('./routes/auditRoutes'); } catch(e) { console.log('⚠️  auditRoutes.js no encontrado, se omite.'); }
try { reportRoutes = require('./routes/reportRoutes'); } catch(e) { console.log('⚠️  reportRoutes.js no encontrado, se omite.'); }
 
// 2. Middlewares
app.use(cors());
app.use(express.json());
 
// 3. Enrutamiento de la API
app.use('/api', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/compras', compraRoutes);
if (auditRoutes)  app.use('/api/auditoria', auditRoutes);
if (reportRoutes) app.use('/api/reportes', reportRoutes);
 
// 4. Encendemos el motor
app.listen(3000, () => {
    console.log('✅ Servidor corriendo en http://localhost:3000');
    console.log('   CORS habilitado para todas las origenes');
});