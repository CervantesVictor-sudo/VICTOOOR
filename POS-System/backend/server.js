const express = require('express');
const cors = require('cors'); // Si no lo tienen instalado, ejecuten: npm i cors
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales fundamentales
app.use(cors());
app.use(express.json()); // Permite al servidor leer formato JSON en las peticiones (Body)

// Importación de Rutas 
const productRoutes = require('./routes/productRoutes');
// const authRoutes = require('./routes/authRoutes'); // Fase 1 - Víctor
// const salesRoutes = require('./routes/salesRoutes'); // Fase 2 - Asaf

// Enrutamiento de la API
app.use('/api/products', productRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/sales', salesRoutes);

// Middleware global para manejo de errores (Centraliza fallos del servidor)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Ocurrió un error interno en el servidor.' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});