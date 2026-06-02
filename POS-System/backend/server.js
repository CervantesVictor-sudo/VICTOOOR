const express = require('express');
const app = express();

// 1. Importación de Rutas
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const salesRoutes = require('./routes/salesRoutes');

// 2. Middlewares
app.use(express.json());

// 3. Enrutamiento de la API
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sales', salesRoutes);

// 4. AL FINAL DEL TODO: Encendemos el motor
app.listen(3000, () => {
    console.log('Servidor corriendo en el puerto 3000');
});