const express = require('express');
const router = express.Router();
const {addLoad, getLoad, updateLoad, postLoad, getLoads, deleteLoad, getLoadShippingInfo} = require('../controllers/load-controller');
const loadMiddleware = require('../middleware/load-middleware');
const authMiddleware = require('../middleware/auth-middleware');
const truckMiddleware = require('../middleware/truck-middleware');

router.post('/api/loads', [authMiddleware, loadMiddleware], addLoad);
router.get('/api/loads/:id', authMiddleware, getLoad);
router.put('/api/loads/:id', [authMiddleware, loadMiddleware], updateLoad);
router.post('/api/loads/:id/post', [authMiddleware, loadMiddleware], postLoad);
router.get('/api/loads', authMiddleware, getLoads);
router.delete('/api/loads/:id', [authMiddleware, loadMiddleware], deleteLoad);
router.get('/api/loads/:id/shipping_info', [authMiddleware, loadMiddleware], getLoadShippingInfo);

module.exports = router;