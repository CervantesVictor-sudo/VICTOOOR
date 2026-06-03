/**
 * TAREA 4.1 — authController.js MODIFICADO
 * Cambios: Se reemplazó el INSERT manual a Auditoria por registrarAccion()
 *          Se agregó auditoría en intentos de login fallidos
 */

const { queryRun, queryGet, beginTransaction, commit, rollback } = require('../config/db');
const { registrarAccion, snapshot } = require('../utils/auditService'); // ← NUEVO
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_para_desarrollo_pos'; 

const registrarUsuario = async (req, res) => {
    const { id_empleado, username, password, rol } = req.body;

    if (!id_empleado || !username || !password || !rol) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    try {
        await beginTransaction();

        const empleado = await queryGet('SELECT id_empleado FROM Empleado WHERE id_empleado = ?', [id_empleado]);
        if (!empleado) {
            await rollback();
            return res.status(404).json({ error: 'El empleado indicado no existe.' });
        }

        const usuarioExistente = await queryGet('SELECT id_usuario FROM Usuario WHERE username = ?', [username]);
        if (usuarioExistente) {
            await rollback();
            return res.status(400).json({ error: 'El nombre de usuario ya está en uso.' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const resultadoUsuario = await queryRun(
            'INSERT INTO Usuario (id_empleado, username, password_hash, rol) VALUES (?, ?, ?, ?)',
            [id_empleado, username, password_hash, rol]
        );

        // ← AUDITORÍA MEJORADA (dentro de la transacción)
        await registrarAccion({
            idUsuario: resultadoUsuario.lastID,
            accion: 'REGISTRO_USUARIO',
            tablaAfectada: 'Usuario',
            registroId: resultadoUsuario.lastID,
            datosNuevos: { id_usuario: resultadoUsuario.lastID, username, rol, id_empleado },
            observaciones: `Usuario "${username}" registrado con rol "${rol}"`
        });

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
        const usuario = await queryGet('SELECT * FROM Usuario WHERE username = ? AND activo = 1', [username]);

        if (!usuario) {
            // ← NUEVO: Auditar intentos fallidos
            await registrarAccion({
                idUsuario: null,
                accion: 'LOGIN_FALLIDO',
                tablaAfectada: 'Usuario',
                observaciones: `Intento con username inexistente: "${username}"`
            });
            return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo.' });
        }

        const passwordValido = await bcrypt.compare(password, usuario.password_hash);
        
        if (!passwordValido) {
            // ← NUEVO: Auditar contraseña incorrecta
            await registrarAccion({
                idUsuario: usuario.id_usuario,
                accion: 'LOGIN_FALLIDO',
                tablaAfectada: 'Usuario',
                registroId: usuario.id_usuario,
                observaciones: 'Contraseña incorrecta'
            });
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        const token = jwt.sign(
            { id_usuario: usuario.id_usuario, id_empleado: usuario.id_empleado, rol: usuario.rol },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        // ← AUDITORÍA MEJORADA: Login exitoso con datos_nuevos
        await registrarAccion({
            idUsuario: usuario.id_usuario,
            accion: 'LOGIN',
            tablaAfectada: 'Usuario',
            registroId: usuario.id_usuario,
            datosNuevos: { username: usuario.username, rol: usuario.rol },
            observaciones: 'Inicio de sesión exitoso'
        });

        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token,
            usuario: { id_usuario: usuario.id_usuario, username: usuario.username, rol: usuario.rol }
        });

    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

module.exports = { registrarUsuario, login };
