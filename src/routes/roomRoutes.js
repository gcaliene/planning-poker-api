const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

router.get('/health', roomController.healthCheck);
router.post('/rooms', roomController.createRoom);
router.get('/rooms/:roomId', roomController.getRoom);

module.exports = router; 