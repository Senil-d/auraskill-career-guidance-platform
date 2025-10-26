const axios = require('axios');
require('dotenv').config();

// Base URL for the artistic assessment model API
const ARTISTIC_MODEL_URL = process.env.ARTISTIC_MODEL_URL || 'http://127.0.0.1:5001';

/**
 * Send CV/portfolio text to the artistic assessment model for classification
 * @param {string} text - The CV or portfolio text to analyze
 * @param {object} assessmentScores - Optional RIASEC assessment scores
 * @returns {object} Prediction result with confidence and probabilities
 */
async function classifyArtisticRole(text, assessmentScores = null) {
  try {
    const payload = {
      text: text,
      assessment_scores: assessmentScores
    };

    console.log('🎨 Calling Flask API at:', `${ARTISTIC_MODEL_URL}/predict`);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

    const response = await axios.post(`${ARTISTIC_MODEL_URL}/predict`, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    console.log('✅ Flask API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ classifyArtisticRole error:');
    console.error('  - URL:', `${ARTISTIC_MODEL_URL}/predict`);
    console.error('  - Status:', error.response?.status);
    console.error('  - Data:', error.response?.data);
    console.error('  - Message:', error.message);
    console.error('  - Code:', error.code);
    throw new Error(error.response?.data?.error || error.message || 'Failed to classify artistic role');
  }
}

/**
 * Calculate final artistic assessment score
 * @param {number} riasecScore - Score from RIASEC assessment (0-10)
 * @param {string} cvPrediction - CV classification result ('artistic' or 'not_artistic')
 * @param {number} cvConfidence - Confidence of CV classification (0-1)
 * @returns {object} Final score calculation
 */
function calculateFinalScore(riasecScore, cvPrediction, cvConfidence) {
  // Convert RIASEC score to percentage (0-100)
  const assessmentPercentage = (riasecScore / 10) * 100;
  
  // CV impact: if artistic prediction, boost score; otherwise, neutral or slight reduction
  let cvImpact = 0;
  if (cvPrediction === 'artistic') {
    cvImpact = cvConfidence * 20; // Max 20% boost
  } else {
    cvImpact = -(cvConfidence * 10); // Max 10% reduction
  }
  
  // Calculate final score (capped between 0-100)
  const finalScore = Math.max(0, Math.min(100, assessmentPercentage + cvImpact));
  
  return {
    assessmentScore: riasecScore,
    assessmentPercentage: Math.round(assessmentPercentage * 10) / 10,
    cvPrediction,
    cvConfidence: Math.round(cvConfidence * 100) / 100,
    cvImpact: Math.round(cvImpact * 10) / 10,
    finalScore: Math.round(finalScore * 10) / 10,
    level: getFinalLevel(finalScore)
  };
}

/**
 * Determine skill level based on final score
 * @param {number} score - Final score (0-100)
 * @returns {string} Skill level
 */
function getFinalLevel(score) {
  if (score >= 80) return 'Expert';
  if (score >= 60) return 'Advanced';
  if (score >= 40) return 'Intermediate';
  if (score >= 20) return 'Beginner';
  return 'Novice';
}

module.exports = {
  classifyArtisticRole,
  calculateFinalScore,
  getFinalLevel
};
