// RIASEC Scoring System - Separate module for skill assessment calculations
// This handles all scoring logic, skill level calculations, and career recommendations

export const SKILL_LEVELS = {
  EXPERT: { name: 'Expert', minPercentage: 90, color: '#059669' },
  ADVANCED: { name: 'Advanced', minPercentage: 80, color: '#0891b2' },
  PROFICIENT: { name: 'Proficient', minPercentage: 70, color: '#3b82f6' },
  COMPETENT: { name: 'Competent', minPercentage: 60, color: '#8b5cf6' },
  DEVELOPING: { name: 'Developing', minPercentage: 40, color: '#f59e0b' },
  BEGINNER: { name: 'Beginner', minPercentage: 0, color: '#ef4444' },
  NO_DATA: { name: 'No Data', minPercentage: 0, color: '#6b7280' }
};

export const RIASEC_DESCRIPTIONS = {
  Realistic: {
    Expert: 'Exceptional hands-on problem-solving abilities and technical mastery',
    Advanced: 'Strong practical skills and mechanical aptitude',
    Proficient: 'Good technical understanding and hands-on capabilities',
    Competent: 'Basic practical skills with room for growth',
    Developing: 'Limited hands-on experience, needs development',
    Beginner: 'Minimal practical/technical experience'
  },
  Investigative: {
    Expert: 'Outstanding analytical thinking and research capabilities',
    Advanced: 'Strong problem-solving and scientific reasoning',
    Proficient: 'Good analytical skills and logical thinking',
    Competent: 'Basic research and analysis abilities',
    Developing: 'Limited analytical experience, needs development',
    Beginner: 'Minimal research/analytical experience'
  },
  Artistic: {
    Expert: 'Exceptional creative vision and artistic expression',
    Advanced: 'Strong creative abilities and innovative thinking',
    Proficient: 'Good creative skills and aesthetic sense',
    Competent: 'Basic creative abilities with potential',
    Developing: 'Limited creative experience, needs development',
    Beginner: 'Minimal artistic/creative experience'
  },
  Social: {
    Expert: 'Outstanding interpersonal and helping skills',
    Advanced: 'Strong communication and people-oriented abilities',
    Proficient: 'Good social skills and empathy',
    Competent: 'Basic interpersonal abilities',
    Developing: 'Limited social experience, needs development',
    Beginner: 'Minimal interpersonal experience'
  },
  Enterprising: {
    Expert: 'Exceptional leadership and business acumen',
    Advanced: 'Strong leadership and entrepreneurial skills',
    Proficient: 'Good persuasion and management abilities',
    Competent: 'Basic leadership potential',
    Developing: 'Limited leadership experience, needs development',
    Beginner: 'Minimal leadership/business experience'
  },
  Conventional: {
    Expert: 'Outstanding organizational and systematic abilities',
    Advanced: 'Strong attention to detail and structure',
    Proficient: 'Good organizational and clerical skills',
    Competent: 'Basic systematic approach to tasks',
    Developing: 'Limited organizational experience, needs development',
    Beginner: 'Minimal organizational/systematic experience'
  }
};

/**
 * Calculate RIASEC skill level based on score and maximum possible score
 * @param {number} score - Actual score achieved
 * @param {number} maxScore - Maximum possible score
 * @returns {object} - { level, percentage, color }
 */
export const calculateRIASECSkillLevel = (score, maxScore) => {
  if (maxScore === 0) {
    return { 
      level: SKILL_LEVELS.NO_DATA.name, 
      percentage: 0, 
      color: SKILL_LEVELS.NO_DATA.color 
    };
  }

  const percentage = Math.round((score / maxScore) * 100);
  
  // Determine skill level based on percentage
  let skillLevel = SKILL_LEVELS.BEGINNER;
  
  if (percentage >= SKILL_LEVELS.EXPERT.minPercentage) {
    skillLevel = SKILL_LEVELS.EXPERT;
  } else if (percentage >= SKILL_LEVELS.ADVANCED.minPercentage) {
    skillLevel = SKILL_LEVELS.ADVANCED;
  } else if (percentage >= SKILL_LEVELS.PROFICIENT.minPercentage) {
    skillLevel = SKILL_LEVELS.PROFICIENT;
  } else if (percentage >= SKILL_LEVELS.COMPETENT.minPercentage) {
    skillLevel = SKILL_LEVELS.COMPETENT;
  } else if (percentage >= SKILL_LEVELS.DEVELOPING.minPercentage) {
    skillLevel = SKILL_LEVELS.DEVELOPING;
  }

  return {
    level: skillLevel.name,
    percentage,
    color: skillLevel.color
  };
};

/**
 * Get skill level color by level name
 * @param {string} level - Skill level name
 * @returns {string} - Color hex code
 */
export const getSkillLevelColor = (level) => {
  const skillLevel = Object.values(SKILL_LEVELS).find(sl => sl.name === level);
  return skillLevel ? skillLevel.color : SKILL_LEVELS.NO_DATA.color;
};

/**
 * Get detailed description for a RIASEC type and skill level
 * @param {string} type - RIASEC type
 * @param {string} level - Skill level
 * @returns {string} - Description text
 */
export const getSkillDescription = (type, level) => {
  return RIASEC_DESCRIPTIONS[type]?.[level] || 'Skill assessment unavailable';
};

/**
 * Process all RIASEC scores into ranked skill data
 * @param {object} scores - RIASEC scores object
 * @param {array} questions - Array of questions to calculate max scores
 * @returns {array} - Sorted array of skill data
 */
export const processRIASECSkills = (scores, questions) => {

  
  if (!questions || questions.length === 0) {

    return [];
  }
  
  const skillData = Object.entries(scores).map(([type, score]) => {
    const questionsForType = questions.filter(q => q.RIASEC_Type === type);
    const maxScore = questionsForType.length;
    const skillLevel = calculateRIASECSkillLevel(score, maxScore);
    

    
    return {
      type,
      score,
      maxScore,
      ...skillLevel,
      description: getSkillDescription(type, skillLevel.level)
    };
  }).sort((a, b) => b.percentage - a.percentage);
  

  return skillData;
};

/**
 * Generate career recommendations based on top skills
 * @param {array} topSkills - Processed skill data
 * @param {array} careerOptions - Available career options
 * @param {object} careerCompatibility - Career compatibility scores
 * @returns {array} - Recommended careers
 */
export const generateCareerRecommendations = (topSkills, careerOptions, careerCompatibility) => {
  const recommendations = [];
  const topThreeSkills = topSkills.slice(0, 3);
  
  // Enhanced career matching based on top skills
  topThreeSkills.forEach(skill => {
    careerOptions.forEach(career => {
      if (career.riasec.includes(skill.type) && skill.percentage >= 60) {
        recommendations.push({
          career: career.name,
          matchReason: `Strong ${skill.type} skills (${skill.level})`,
          compatibility: careerCompatibility[career.id] || 0,
          skillType: skill.type,
          skillLevel: skill.level
        });
      }
    });
  });
  
  // Remove duplicates and sort by compatibility
  const uniqueRecommendations = recommendations
    .filter((rec, index, self) => 
      index === self.findIndex(r => r.career === rec.career)
    )
    .sort((a, b) => b.compatibility - a.compatibility)
    .slice(0, 3);
  
  return uniqueRecommendations;
};

/**
 * Calculate overall assessment score color
 * @param {number} percentage - Overall percentage score
 * @returns {string} - Color hex code
 */
export const getOverallScoreColor = (percentage) => {
  if (percentage >= 80) return '#059669';
  if (percentage >= 60) return '#3b82f6';
  if (percentage >= 40) return '#f59e0b';
  return '#ef4444';
};

/**
 * Get motivational message based on score
 * @param {number} percentage - Overall percentage score
 * @returns {string} - Motivational message
 */
export const getScoreMessage = (percentage) => {
  if (percentage >= 90) return 'Excellent! 🎉';
  if (percentage >= 80) return 'Great job! 👍';
  if (percentage >= 70) return 'Good work! 👏';
  if (percentage >= 60) return 'Not bad! 🙂';
  if (percentage >= 50) return 'Average. 📊';
  return 'Keep practicing! 💪';
};

/**
 * Calculate final combined score from assessment and CV analysis
 * @param {number} assessmentScore - Score out of 10 from assessment
 * @param {object} cvAnalysis - CV analysis result with prediction
 * @returns {object} - Final score and level information
 */
export const calculateFinalScore = (assessmentScore, cvAnalysis = null) => {
  let finalScore = assessmentScore;
  let bonusPoints = 0;
  let bonusReason = '';
  
  // Add bonus point if CV is classified as artistic by the API
  if (cvAnalysis && cvAnalysis.prediction) {
    const prediction = cvAnalysis.prediction.toLowerCase().trim();
    
    // Check if CV classifier API returned 'artistic' prediction
    if (prediction === 'artistic') {
      bonusPoints = 1;
      bonusReason = 'Artistic CV detected by classifier';
      finalScore = Math.min(10, assessmentScore + bonusPoints); // Cap at 10
    }
  }
  
  return {
    finalScore,
    assessmentScore,
    bonusPoints,
    bonusReason,
    level: getFinalScoreLevel(finalScore)
  };
};

/**
 * Determine skill level based on final score
 * @param {number} score - Final score out of 10
 * @returns {object} - Level information
 */
export const getFinalScoreLevel = (score) => {
  if (score >= 8) {
    return {
      name: 'Advanced',
      description: 'Excellent artistic and creative skills',
      color: '#059669',
      minScore: 8
    };
  } else if (score >= 5) {
    return {
      name: 'Intermediate',
      description: 'Good artistic potential with room for growth',
      color: '#3b82f6',
      minScore: 5
    };
  } else {
    return {
      name: 'Beginner',
      description: 'Starting journey in artistic skills',
      color: '#f59e0b',
      minScore: 0
    };
  }
};

/**
 * Convert assessment percentage to score out of 10
 * @param {number} totalCorrect - Number of correct answers
 * @param {number} totalQuestions - Total number of questions
 * @returns {number} - Score out of 10
 */
export const convertToScoreOutOf10 = (totalCorrect, totalQuestions) => {
  if (totalQuestions === 0) return 0;
  const percentage = (totalCorrect / totalQuestions) * 100;
  return Math.round((percentage / 100) * 10 * 10) / 10; // Round to 1 decimal place
};

/**
 * Main function to process complete assessment results
 * @param {object} assessmentData - Complete assessment data
 * @returns {object} - Processed results for display
 */
export const processAssessmentResults = (assessmentData) => {
  const {
    scores,
    questions,
    totalCorrect,
    totalQuestions,
    careerOptions,
    careerCompatibility,
    cvAnalysis
  } = assessmentData;

  const topSkills = processRIASECSkills(scores, questions);
  const recommendations = generateCareerRecommendations(topSkills, careerOptions, careerCompatibility);
  const percentageScore = Math.round((totalCorrect / totalQuestions) * 100);
  const scoreColor = getOverallScoreColor(percentageScore);
  const scoreMessage = getScoreMessage(percentageScore);
  
  // Calculate assessment score out of 10
  const assessmentScoreOut10 = convertToScoreOutOf10(totalCorrect, totalQuestions);
  
  // Calculate final combined score
  const finalScoreData = calculateFinalScore(assessmentScoreOut10, cvAnalysis);

  return {
    topSkills,
    recommendations,
    percentageScore,
    scoreColor,
    scoreMessage,
    totalCorrect,
    totalQuestions,
    assessmentScoreOut10,
    finalScoreData
  };
};