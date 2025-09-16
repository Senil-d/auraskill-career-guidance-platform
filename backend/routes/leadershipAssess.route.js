const express = require('express');
const router = express.Router();
const {protect} = require('../middlewares/authMiddleware.js');

const {
  startSession,
  submitAnswer,
  getSummary,
} = require('../controllers/leadershipAssess.controller');


router.post('/start', protect, startSession);
router.post('/submit', protect, submitAnswer);
router.get('/summary/:session_token', protect, getSummary);

module.exports = router;
