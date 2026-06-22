const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // Necesario para el login
const jwt = require('jsonwebtoken'); // Necesario para la seguridad
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Conexión a la Base de Datos PostgreSQL (Supabase)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Ruta de prueba (La que ves al entrar al link de Render)
app.get('/', (req, res) => {
    res.send('Servidor de Sanctorum A.C. funcionando correctamente.');
});

// Ruta 1: GUARDAR SOLICITUDES WEB (Formulario Público)
app.post('/api/solicitudes', async (req, res) => {
    const { nombre_contacto, correo, telefono, tipo_solicitud, mensaje } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO Solicitudes_Web (nombre_contacto, correo, telefono, tipo_solicitud, mensaje) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [nombre_contacto, correo, telefono, tipo_solicitud, mensaje]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al guardar la solicitud' });
    }
});

// Ruta 2: INICIO DE SESIÓN (Login)
app.post('/api/auth/login', async (req, res) => {
    const { correo, contraseña } = req.body;
    try {
        // Busca si el correo existe
        const result = await pool.query('SELECT * FROM Usuarios WHERE correo = $1', [correo]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no registrado.' });
        }

        const usuario = result.rows[0];
        // Compara la contraseña
        const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);
        if (!contraseñaValida) {
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
        }

        // Crea una "llave" de acceso (Token)
        const token = jwt.sign({ id: usuario.id_usuario, rol: usuario.id_rol }, 'SECRETO_SANCTORUM', { expiresIn: '4h' });
        res.json({ success: true, token, usuario: { nombre: usuario.nombre_completo } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});