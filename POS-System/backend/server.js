const express = require('express');
const app = express();

app.listen(3000, () => console.log('Servidor corriendo'));

// ... (arriba queda todo igual)

// Importación de Rutas
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes'); 
const salesRoutes = require('./routes/salesRoutes'); // <-- 1. Agregamos esta línea

// Enrutamiento de la API
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes); 
app.use('/api/sales', salesRoutes); // <-- 2. Y exponemos el endpoint aquí

// ... (abajo queda todo igual)