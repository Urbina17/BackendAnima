const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const spotifyRoutes = require("./routes/spotify");
const emocionesRoutes = require("./routes/emociones");
const playbackRoutes = require("./routes/playback"); // ✅ NUEVO

// Importar rutas y middlewares
const authRoutes = require('./routes/auth');
const errorHandler = require('./middlewares/errorHandler');

// Crear instancia de Express
const app = express();

// --- Middlewares globales ---
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-spotify-token'
  ]
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// --- Rutas principales ---
app.use('/auth', authRoutes);
app.use('/auth/spotify', spotifyRoutes);
app.use('/emociones', emocionesRoutes);
app.use('/api/playback', playbackRoutes); // ✅ NUEVA RUTA

// --- Manejo global de errores (SIEMPRE AL FINAL) ---
app.use(errorHandler);

module.exports = app;