const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');

const {
  classifyCV,
  saveArtisticResult,
  getArtisticResult
} = require('../controllers/artisticController');

// POST /api/artistic/classify - Classify CV/portfolio text
router.post('/classify', protect, classifyCV);

// POST /api/artistic/save-result - Save artistic assessment result
router.post('/save-result', protect, saveArtisticResult);

// GET /api/artistic/result - Get saved artistic assessment result
router.get('/result', protect, getArtisticResult);

module.exports = router;
