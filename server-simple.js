const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080', '*'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Serve static files
app.use(express.static('.', {
    extensions: ['html'],
    index: 'index.html',
    setHeaders: (res, path) => {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
    }
}));

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'words_learning_jwt_secret_2024';

// PostgreSQL connection
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'words_learning',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 20
});

let useDatabase = false;

// Initialize database connection
async function initDatabase() {
    try {
        await pool.query('SELECT 1');
        useDatabase = true;
        console.log('✅ PostgreSQL connected successfully');
    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error.message);
        console.log('📁 Falling back to in-memory storage');
        useDatabase = false;
    }
}

// Simple health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: useDatabase ? 'postgresql' : 'in-memory'
    });
});

// Basic auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Start server
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📊 Database: ${useDatabase ? 'PostgreSQL' : 'In-Memory'}`);
        console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    });
}).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});