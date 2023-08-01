var express = require('express');
var router = express.Router();

//User
router.get('/products_map', require('../controller/productQuery'));

module.exports = router;