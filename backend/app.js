const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
const fileRoutes = require('./routes/fileRoutes');
app.use('/api/files', fileRoutes);

module.exports = app;