const { queryRun, queryGet, beginTransaction, commit, rollback } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// En producción, esto debe venir de un archivo .env
const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_para_desarrollo_pos'; 

const registrarUsuario = async (req, res) => {
    const { id_empleado, username, password, rol } = req.body;

    if (!id_empleado || !username || !password || !rol) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    try {
        await beginTransaction();

        // 1. Validar que el empleado exista en la base de datos
        const empleado = await queryGet('SELECT id_empleado FROM Empleado WHERE id_empleado = ?', [id_empleado]);
        if (!empleado) {
            await rollback();
            return res.status(404).json({ error: 'El empleado indicado no existe.' });
        }

        // 2. Validar que el nombre de usuario no esté ocupado
        const usuarioExistente = await queryGet('SELECT id_usuario FROM Usuario WHERE username = ?', [username]);
        if (usuarioExistente) {
            await rollback();
            return res.status(400).json({ error: 'El nombre de usuario ya está en uso.' });
        }

        // 3. Encriptar (hashear) la contraseña
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 4. Insertar el usuario en la base de datos
        const resultadoUsuario = await queryRun(
            'INSERT INTO Usuario (id_empleado, username, password_hash, rol) VALUES (?, ?, ?, ?)',
            [id_empleado, username, password_hash, rol]
        );

        // 5. Registrar el evento en la Auditoría
        await queryRun(
            'INSERT INTO Auditoria (id_usuario, accion, tabla_afectada, registro_id) VALUES (?, ?, ?, ?)',
            [resultadoUsuario.lastID, 'REGISTRO_USUARIO', 'Usuario', resultadoUsuario.lastID]
        );

        await commit();
        res.status(201).json({ message: 'Usuario registrado exitosamente', id_usuario: resultadoUsuario.lastID });

    } catch (error) {
        await rollback();
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor al procesar el registro.' });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña son obligatorios.' });
    }

    try {
        // 1. Buscar al usuario por su username
        const usuario = await queryGet('SELECT * FROM Usuario WHERE username = ? AND activo = 1', [username]);
        
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo.' });
        }

        // 2. Comparar la contraseña ingresada con el hash guardado
        const passwordValido = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordValido) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // 3. Generar el JSON Web Token (JWT)
        const token = jwt.sign(
            {
                id_usuario: usuario.id_usuario,
                id_empleado: usuario.id_empleado,
                rol: usuario.rol
            },
            JWT_SECRET,
            { expiresIn: '8h' } // El token dura un turno laboral de 8 horas
        );

        // 4. Registrar el inicio de sesión en Auditoría
        await queryRun(
            'INSERT INTO Auditoria (id_usuario, accion, tabla_afectada, registro_id) VALUES (?, ?, ?, ?)',
            [usuario.id_usuario, 'LOGIN', 'Usuario', usuario.id_usuario]
        );

        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token,
            usuario: {
                id_usuario: usuario.id_usuario,
                username: usuario.username,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

module.exports = {
    registrarUsuario,
    login
};