'use strict';

const router = module.exports = require('express').Router();

router.use('/categories', require('./controllers/categoriesController.js'));
router.use('/demo', require('./controllers/demoController.js'));
