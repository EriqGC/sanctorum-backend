const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors()); // Permite que tu HTML de GitHub se conecte aquí
app.use(express.json()); // Permite recibir datos de formularios (JSON)

// Conexión a la Base de Datos PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Requerido por servicios en la nube
});

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Servidor de Sanctorum A.C. funcionando correctamente.');
});

// Ruta para GUARDAR una solicitud de apoyo desde la página web
app.post('/api/solicitudes', async (req, res) => {
    const { nombre, correo, telefono, tipo_solicitud, mensaje } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO Solicitudes_Web (nombre_contacto, correo, telefono, tipo_solicitud, mensaje) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [nombre, correo, telefono, tipo_solicitud, mensaje]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al guardar la solicitud' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});