const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api', productRoutes);

app.get('/', (req, res) => res.json({ message: 'API POS TRUE Responsive activa' }));

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
