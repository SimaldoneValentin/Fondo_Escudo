

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Conexión usando tu archivo .env
const db = mysql.createConnection({
    host: process.env.DB_HOST || '34.176.159.188',
    user: process.env.DB_USER || 'developer',
    password: process.env.DB_PASSWORD || 'p4$$w0rd',
    database: process.env.DB_NAME || 'fondo_escudo',
    port: process.env.DB_PORT || 3306
});

db.connect(err => {
    if (err) {
        console.error('❌ Error de conexión:', err.message);
        return;
    }
    console.log('✅ Conectado a Google Cloud SQL');
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/auth/register', (req, res) => {
    const { email, firstName, lastName, dni, gender, phone, password } = req.body;
    const sql = `INSERT INTO users (email, first_name, last_name, dni, gender, phone, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.query(sql, [email, firstName, lastName, dni, gender, phone, password], (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true });
    });
});

app.listen(3001, () => console.log('🚀 Servidor listo en http://localhost:3001'));