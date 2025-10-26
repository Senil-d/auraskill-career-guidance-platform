const artisticService = require('../servivces/artisticServices');
const User = require('../models/userModel');

/**
 * POST /api/artistic/classify
 * Classify CV/portfolio text using the artistic assessment model
 */
const classifyCV = async (req, res) => {
  try {
    const { text, assessmentScores } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required for classification' });
    }

    // Call the artistic model service
    const classificationResult = await artisticService.classifyArtisticRole(text, assessmentScores);

    return res.status(200).json(classificationResult);
  } catch (error) {
    console.error('classifyCV error:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/artistic/save-result
 * Save artistic assessment result to user profile
 */
const saveArtisticResult = async (req, res) => {
  try {
    const {
      riasecScores,
      riasecAssessmentScore,
      totalCorrect,
      totalQuestions,
      cvText,
      cvPrediction,
      cvConfidence,
      cvProbabilities
    } = req.body;

    // Validate required fields
    if (!riasecAssessmentScore || !cvPrediction || cvConfidence === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: riasecAssessmentScore, cvPrediction, cvConfidence'
      });
    }

    // Find the user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate final score
    const finalResult = artisticService.calculateFinalScore(
      riasecAssessmentScore,
      cvPrediction,
      cvConfidence
    );

    // Prepare artistic result object
    const artisticResult = {
      traits: riasecScores || {},
      overall_score: finalResult.finalScore,
      level: finalResult.level,
      feedback: generateFeedback(finalResult),
      details: {
        assessmentScore: riasecAssessmentScore,
        assessmentPercentage: finalResult.assessmentPercentage,
        totalCorrect: totalCorrect || 0,
        totalQuestions: totalQuestions || 30,
        cvAnalysis: {
          prediction: cvPrediction,
          confidence: cvConfidence,
          probabilities: cvProbabilities || {},
          cvText: cvText || ''
        },
        cvImpact: finalResult.cvImpact,
        calculatedAt: new Date().toISOString()
      }
    };

    console.log('💾 Saving artistic result to MongoDB:');
    console.log('  - User ID:', req.user.id);
    console.log('  - Overall Score:', artisticResult.overall_score);
    console.log('  - Level:', artisticResult.level);
    console.log('  - Traits:', artisticResult.traits);
    console.log('  - Details:', JSON.stringify(artisticResult.details, null, 2));

    // Save to user's current results under 'artistic' key (latest attempt)
    if (!user.results) {
      user.results = new Map();
    }
    user.results.set('artistic', artisticResult);

    // Also save to artisticHistory array for tracking multiple attempts
    if (!user.artisticHistory) {
      user.artisticHistory = [];
    }
    
    const attemptNumber = user.artisticHistory.length + 1;
    const historyEntry = {
      ...artisticResult,
      attemptNumber: attemptNumber,
      completedAt: new Date()
    };
    
    user.artisticHistory.push(historyEntry);

    await user.save();

    console.log('✅ Artistic result saved successfully to database');
    console.log('📊 Total attempts:', attemptNumber);
    console.log('🔍 Verifying saved data:', user.results.get('artistic'));

    return res.status(200).json({
      message: 'Artistic assessment result saved successfully',
      result: artisticResult,
      finalScore: finalResult
    });

  } catch (error) {
    console.error('saveArtisticResult error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/artistic/result
 * Retrieve saved artistic assessment result for the user
 */
const getArtisticResult = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const artisticResult = user.results?.get('artistic');
    
    if (!artisticResult) {
      return res.status(404).json({ message: 'No artistic assessment result found' });
    }

    // Convert Map fields to plain objects for proper JSON serialization
    const resultToSend = {
      traits: artisticResult.traits instanceof Map ? Object.fromEntries(artisticResult.traits) : (artisticResult.traits || {}),
      overall_score: artisticResult.overall_score,
      level: artisticResult.level,
      feedback: artisticResult.feedback,
      details: artisticResult.details || {}
    };

    // Get assessment history (all past attempts)
    const history = (user.artisticHistory || []).map(attempt => ({
      traits: attempt.traits instanceof Map ? Object.fromEntries(attempt.traits) : (attempt.traits || {}),
      overall_score: attempt.overall_score,
      level: attempt.level,
      feedback: attempt.feedback,
      details: attempt.details || {},
      attemptNumber: attempt.attemptNumber,
      completedAt: attempt.completedAt,
      _id: attempt._id
    }));

    console.log('Sending artistic result:', JSON.stringify(resultToSend, null, 2));
    console.log('Total attempts in history:', history.length);

    return res.status(200).json({
      message: 'Artistic assessment result retrieved successfully',
      result: resultToSend,
      history: history,
      totalAttempts: history.length
    });

  } catch (error) {
    console.error('getArtisticResult error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Generate feedback based on final result
 * @param {object} finalResult - Final score calculation result
 * @returns {string} Feedback message
 */
function generateFeedback(finalResult) {
  const { finalScore, level, cvPrediction, cvImpact } = finalResult;
  
  let feedback = `You've achieved a ${level} level in artistic skills with a score of ${finalScore}/100. `;
  
  if (finalScore >= 80) {
    feedback += 'Excellent! You demonstrate strong artistic abilities. ';
  } else if (finalScore >= 60) {
    feedback += 'Great job! You have solid artistic skills. ';
  } else if (finalScore >= 40) {
    feedback += 'Good progress! Continue developing your artistic skills. ';
  } else {
    feedback += 'Keep practicing to improve your artistic abilities. ';
  }

  if (cvPrediction === 'artistic' && cvImpact > 0) {
    feedback += `Your CV/portfolio shows strong alignment with artistic roles, boosting your score by ${Math.abs(cvImpact)}%.`;
  } else if (cvPrediction !== 'artistic' && cvImpact < 0) {
    feedback += `Your CV/portfolio could be enhanced to better reflect artistic skills.`;
  }

  return feedback;
}

module.exports = {
  classifyCV,
  saveArtisticResult,
  getArtisticResult
};
