const express = require('express');
const router = express.Router();
const {protect} = require('../middlewares/authMiddleware.js');

const {
  startSession,
  submitAnswer,
  getSummary,
} = require('../controllers/leadership.controller.js');



router.post('/start', protect, startSession);
router.post('/answer', protect, submitAnswer);
router.get('/summary/:session_id', protect, getSummary);

module.exports = router;
