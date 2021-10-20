const express = require('express');
const router = express.Router();
const {addTruck, assignTruck, deleteTruck, getTrucks, getTruck, updateTruck, getActiveLoad, goToNextLoadState} = require('../controllers/truck-controller');
const truckMiddleware = require('../middleware/truck-middleware');
const authMiddleware = require('../middleware/auth-middleware');

router.post('/api/trucks', [authMiddleware, truckMiddleware], addTruck);
router.post('/api/trucks/:id/assign', [authMiddleware, truckMiddleware], assignTruck);
router.delete('/api/trucks/:id', [authMiddleware, truckMiddleware], deleteTruck);
router.get('/api/trucks', [authMiddleware, truckMiddleware], getTrucks);
router.get('/api/trucks/:id', [authMiddleware, truckMiddleware], getTruck);
router.put('/api/trucks/:id', [authMiddleware, truckMiddleware], updateTruck);
router.get('/api/loads/active', [authMiddleware, truckMiddleware], getActiveLoad);
router.patch('/api/loads/active/state', [authMiddleware, truckMiddleware], goToNextLoadState);

module.exports = router;