const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_para_desarrollo_pos';

const verificarToken = (req, res, next) => {
    // Buscar el token en el encabezado de autorización
    const authHeader = req.header('Authorization');

    // Validar que el token exista y tenga el formato 'Bearer <token>'
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado o formato inválido.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Desencriptar y validar el token
        const payload = jwt.verify(token, JWT_SECRET);
        
        // Inyectar los datos del usuario en la petición (req) para que 
        // los demás controladores sepan quién está ejecutando la acción
        req.usuario = payload; 
        
        next(); // Permitir que la petición continúe
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};

module.exports = {
    verificarToken
};