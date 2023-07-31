var express = require('express');
var router = express.Router();

//User
//router.get('/user', require('../../src/models/User/get'));
router.get('/test', require('../controller/productController'));
//router.post('/user',  require('../../src/models/User/create'));

module.exports = router;