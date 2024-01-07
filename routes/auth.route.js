const express = require('express');
const { createUser } = require('../controller/user.controller');

const router = express.Router();

router.post('/register', createUser)
router.post('/login', createUser)

module.exports = router;
