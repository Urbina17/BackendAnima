const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

// Importar rutas y middlewares
const authRoutes = require('./routes/auth');
const errorHandler = require('./middlewares/errorHandler');

// Crear instancia de Express
const app = express();

// --- Middlewares globales ---
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// --- Rutas principales ---
app.use('/auth', authRoutes);

// --- Manejo global de errores ---
app.use(errorHandler);

module.exports = app;
