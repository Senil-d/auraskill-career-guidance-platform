const express = require('express');
const router = express.Router();
const { startSession, submitAnswer, getSummary } = require('../controllers/leadership.controller');
const {protect}   = require('../middlewares/authMiddleware');

router.post('/start', protect, startSession);
router.post('/answer', protect, submitAnswer);
router.get('/summary', protect, getSummary); 

module.exports = router;
