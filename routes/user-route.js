const express = require('express');
const {getUserInfo, deleteUser, changePassword}= require('../controllers/user-controller');
const router = express.Router();
const authMiddleware = require('../middleware/auth-middleware');

router.get('/api/users/me', authMiddleware, getUserInfo);
router.delete('/api/users/me', authMiddleware, deleteUser);
router.patch('/api/users/me/password', authMiddleware, changePassword);

module.exports = router;