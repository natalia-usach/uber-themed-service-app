const express = require('express');
const {registerUser, loginUser, recoverPassword} = require('../controllers/auth-controller');
const router = express.Router();

router.post('/api/auth/register', registerUser);
router.post('/api/auth/login', loginUser);
router.post('/api/auth/forgot_password', recoverPassword);

module.exports = router;
