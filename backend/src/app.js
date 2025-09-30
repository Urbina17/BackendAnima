const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// middlewares globales
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(morgan('dev'));

// rutas
app.use('/auth', authRoutes);

// handler de errores
app.use(errorHandler);

module.exports = app;
