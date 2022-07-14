'use strict';

const router = module.exports = require('express').Router();

router.use('/products', require('./controllers/productsController.js'));