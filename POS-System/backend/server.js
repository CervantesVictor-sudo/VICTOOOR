const express = require('express');
const cors = require('cors'); 
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json()); 

// Importación de Rutas
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes'); 

// Enrutamiento de la API
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes); 

// Middleware global para manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Ocurrió un error interno en el servidor.' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});