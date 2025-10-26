import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const APP_COLORS = {
  primary: '#6A5AE0',
  secondary: '#836FFF', 
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  light: '#ffffff',
  background: '#F7F7F7',
  cardBackground: '#ffffff',
  text: '#333333',
  subtext: '#888888',
  border: '#E0E0E0'
};

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 350;
const isMediumScreen = width >= 350 && width <= 400;
const isLargeScreen = width > 400;

const getResponsiveValue = (small, medium, large) => {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return large;
};

const FinalScoreScreen = ({ route }) => {
  const navigation = useNavigation();
  
  // Extract data from route params (React Navigation) or props (direct usage)
  const {
    assessmentScore,
    cvPrediction,
    cvConfidence,
    selectedCareer,
    onNavigateHome,
    onRetakeAssessment
  } = route?.params || {};
  
  // Add debugging logs to see what data we're receiving
  console.log('FinalScoreScreen received data:', {
    assessmentScore,
    cvPrediction,
    cvConfidence,
    selectedCareer
  });
  
  // Show helpful message if no score data is available
  if (assessmentScore === undefined && cvPrediction === undefined) {
    console.warn('FinalScoreScreen: No score data received. Expected route.params with assessmentScore.');
  }

  // Calculate final score out of 100
  const calculateFinalScore = () => {
    console.log('Starting calculateFinalScore with:', { assessmentScore, cvPrediction, cvConfidence });
    
    // Validate and sanitize input values
    const validAssessmentScore = isNaN(assessmentScore) || assessmentScore === null || assessmentScore === undefined ? 0 : Number(assessmentScore);
    const validCvConfidence = isNaN(cvConfidence) || cvConfidence === null || cvConfidence === undefined ? 0 : Number(cvConfidence);
    
    console.log('Validated inputs:', { validAssessmentScore, validCvConfidence });
    
    // Assessment contributes 80 points out of 100
    const assessmentPoints = Math.round((validAssessmentScore / 10) * 80);
    
    console.log('Assessment points calculation:', { validAssessmentScore, assessmentPoints });
    
    // CV bonus contributes up to 20 points
    let bonusPoints = 0;
    let bonusReason = '';
    
    if (cvPrediction && typeof cvPrediction === 'string') {
      const prediction = cvPrediction.toLowerCase().trim();
      if (prediction === 'artistic') {
        // Give bonus based on confidence level
        bonusPoints = Math.round(validCvConfidence * 20);
        bonusReason = `CV classified as artistic (${Math.round(validCvConfidence * 100)}% confidence)`;
      } else {
        bonusPoints = 0;
        bonusReason = 'CV classified as non-artistic';
      }
    } else {
      bonusPoints = 0;
      bonusReason = 'No CV analysis performed';
    }
    
    // Ensure no NaN values
    const safeAssessmentPoints = isNaN(assessmentPoints) ? 0 : assessmentPoints;
    const safeBonusPoints = isNaN(bonusPoints) ? 0 : bonusPoints;
    const finalScore = safeAssessmentPoints + safeBonusPoints;
    
    const result = {
      finalScore: isNaN(finalScore) ? 0 : finalScore,
      assessmentPoints: safeAssessmentPoints,
      bonusPoints: safeBonusPoints,
      bonusReason,
      level: getScoreLevel(finalScore),
      validAssessmentScore // Return the validated score for display
    };
    
    console.log('Final score calculation result:', result);
    return result;
  };

  const getScoreLevel = (score) => {
    // Ensure score is a valid number
    const validScore = isNaN(score) || score === null || score === undefined ? 0 : Number(score);
    
    if (validScore >= 90) {
      return {
        name: 'Exceptional',
        description: 'Outstanding artistic and creative abilities',
        color: '#059669',
        emoji: '🌟'
      };
    } else if (validScore >= 80) {
      return {
        name: 'Advanced',
        description: 'Strong artistic skills with excellent potential',
        color: '#0891b2',
        emoji: '🎨'
      };
    } else if (validScore >= 70) {
      return {
        name: 'Proficient',
        description: 'Good artistic abilities with room for growth',
        color: '#3b82f6',
        emoji: '🎭'
      };
    } else if (validScore >= 60) {
      return {
        name: 'Competent',
        description: 'Developing artistic skills with potential',
        color: '#8b5cf6',
        emoji: '🖌️'
      };
    } else if (validScore >= 50) {
      return {
        name: 'Developing',
        description: 'Basic artistic understanding, keep practicing',
        color: '#f59e0b',
        emoji: '📚'
      };
    } else {
      return {
        name: 'Beginner',
        description: 'Starting your artistic journey',
        color: '#ef4444',
        emoji: '🌱'
      };
    }
  };

  const scoreData = calculateFinalScore();

  const getMotivationalMessage = (score) => {
    const validScore = isNaN(score) || score === null || score === undefined ? 0 : Number(score);
    if (validScore >= 90) return "Absolutely brilliant! You're a creative powerhouse! 🚀";
    if (validScore >= 80) return "Excellent work! Your artistic talents are impressive! 🎉";
    if (validScore >= 70) return "Great job! You have strong creative abilities! 👏";
    if (validScore >= 60) return "Good progress! Keep developing your artistic skills! 💪";
    if (validScore >= 50) return "Nice start! Continue exploring your creative side! 🌟";
    return "Keep going! Every artist starts somewhere! 🎨";
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.stepContainer}>
        <Text style={styles.title}>🎯 Final Assessment Score</Text>
        <Text style={styles.subtitle}>
          Complete evaluation for {selectedCareer?.name || 'Artistic Career'}
        </Text>

        {/* Main Score Display */}
        <View style={[styles.mainScoreContainer, { borderColor: scoreData.level.color }]}>
          <View style={styles.scoreHeader}>
            <Text style={styles.levelEmoji}>{scoreData.level.emoji}</Text>
            <View style={[styles.scoreCircle, { borderColor: scoreData.level.color }]}>
              <Text style={[styles.scoreCircleText, { color: scoreData.level.color }]}>
                {scoreData.finalScore}
              </Text>
              <Text style={styles.scoreOutOf}>/ 100</Text>
            </View>
          </View>
          
          <View style={[styles.levelBadge, { backgroundColor: scoreData.level.color }]}>
            <Text style={styles.levelName}>{scoreData.level.name}</Text>
          </View>
          
          <Text style={styles.levelDescription}>
            {scoreData.level.description}
          </Text>
          
          <Text style={[styles.motivationalMessage, { color: scoreData.level.color }]}>
            {getMotivationalMessage(scoreData.finalScore)}
          </Text>
        </View>

        {/* Score Breakdown */}
        <View style={styles.breakdownContainer}>
          <Text style={styles.breakdownTitle}>📊 Score Breakdown</Text>
          
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Assessment Score</Text>
              <Text style={styles.breakdownValue}>{scoreData.assessmentPoints}/80</Text>
              <Text style={styles.breakdownSubtext}>
                Based on {scoreData.validAssessmentScore || 0}/10 assessment performance
              </Text>
            </View>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>CV Bonus Points</Text>
              <Text style={[
                styles.breakdownValue,
                scoreData.bonusPoints > 0 ? styles.bonusValue : styles.noBonusValue
              ]}>
                +{scoreData.bonusPoints}/20
              </Text>
              <Text style={styles.breakdownSubtext}>
                {scoreData.bonusReason}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Score</Text>
            <Text style={[styles.totalValue, { color: scoreData.level.color }]}>
              {scoreData.finalScore}/100
            </Text>
          </View>
        </View>

        {/* CV Analysis Details */}
        {cvPrediction && (
          <View style={styles.cvAnalysisContainer}>
            <Text style={styles.cvAnalysisTitle}>🔍 CV Analysis Results</Text>
            
            <View style={[
              styles.predictionBadge,
              cvPrediction.toLowerCase() === 'artistic' ? 
              styles.artisticPrediction : styles.nonArtisticPrediction
            ]}>
              <Text style={styles.predictionText}>
                Classification: {cvPrediction}
              </Text>
              <Text style={styles.confidenceText}>
                Confidence: {Math.round((cvConfidence || 0) * 100)}%
              </Text>
            </View>

            <View style={styles.confidenceBar}>
              <View 
                style={[
                  styles.confidenceFill, 
                  { 
                    width: `${(cvConfidence || 0) * 100}%`,
                    backgroundColor: (cvPrediction && cvPrediction.toLowerCase() === 'artistic') ? 
                      '#059669' : '#ef4444'
                  }
                ]} 
              />
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: scoreData.level.color }]}
            onPress={() => navigation.navigate('home')}
          >
            <Text style={styles.primaryButtonText}>🏠 Return to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.profileButton, { borderColor: scoreData.level.color }]}
            onPress={() => {
              // Navigate to artistic profile screen to view saved database results
              navigation.navigate('artisticprofile');
            }}
          >
            <Text style={[styles.profileButtonText, { color: scoreData.level.color }]}>
              👤 View Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => {
              if (onRetakeAssessment) {
                onRetakeAssessment();
              } else {
                // Fallback navigation to career assessment
                navigation.navigate('careerassessment');
              }
            }}
          >
            <Text style={styles.secondaryButtonText}>🔄 Retake Assessment</Text>
          </TouchableOpacity>
        </View>

        {/* Performance Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>📈 Performance Summary</Text>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Assessment</Text>
              <Text style={styles.summaryValue}>{scoreData.validAssessmentScore || 0}/10</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>CV Bonus</Text>
              <Text style={styles.summaryValue}>+{scoreData.bonusPoints}</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Final Score</Text>
              <Text style={[styles.summaryValue, { color: scoreData.level.color }]}>
                {scoreData.finalScore}/100
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.dark,
  },
  stepContainer: {
    flex: 1,
    padding: getResponsiveValue(16, 20, 24),
    backgroundColor: APP_COLORS.dark,
  },
  title: {
    fontSize: getResponsiveValue(24, 26, 28),
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: getResponsiveValue(8, 10, 12),
  },
  subtitle: {
    fontSize: getResponsiveValue(16, 17, 18),
    color: APP_COLORS.darkSubtext,
    textAlign: 'center',
    marginBottom: getResponsiveValue(24, 28, 32),
    fontWeight: '500',
  },
  
  // Main Score Container
  mainScoreContainer: {
    backgroundColor: APP_COLORS.darkCard,
    padding: getResponsiveValue(24, 28, 32),
    borderRadius: 24,
    marginBottom: getResponsiveValue(20, 24, 28),
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  scoreHeader: {
    alignItems: 'center',
    marginBottom: getResponsiveValue(16, 20, 24),
  },
  levelEmoji: {
    fontSize: getResponsiveValue(32, 36, 40),
    marginBottom: getResponsiveValue(12, 14, 16),
  },
  scoreCircle: {
    width: getResponsiveValue(120, 140, 160),
    height: getResponsiveValue(120, 140, 160),
    borderRadius: getResponsiveValue(60, 70, 80),
    backgroundColor: APP_COLORS.dark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    shadowColor: APP_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  scoreCircleText: {
    fontSize: getResponsiveValue(36, 40, 44),
    fontWeight: 'bold',
  },
  scoreOutOf: {
    fontSize: getResponsiveValue(16, 18, 20),
    color: APP_COLORS.darkSubtext,
    fontWeight: '600',
  },
  levelBadge: {
    paddingHorizontal: getResponsiveValue(20, 24, 28),
    paddingVertical: getResponsiveValue(12, 14, 16),
    borderRadius: 20,
    marginBottom: getResponsiveValue(12, 14, 16),
  },
  levelName: {
    color: 'white',
    fontSize: getResponsiveValue(18, 20, 22),
    fontWeight: 'bold',
  },
  levelDescription: {
    fontSize: getResponsiveValue(15, 16, 17),
    color: APP_COLORS.darkSubtext,
    textAlign: 'center',
    marginBottom: getResponsiveValue(12, 14, 16),
    lineHeight: getResponsiveValue(20, 22, 24),
  },
  motivationalMessage: {
    fontSize: getResponsiveValue(16, 17, 18),
    fontWeight: 'bold',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Breakdown Container
  breakdownContainer: {
    backgroundColor: APP_COLORS.darkCard,
    padding: getResponsiveValue(20, 24, 28),
    borderRadius: 20,
    marginBottom: getResponsiveValue(16, 20, 24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  breakdownTitle: {
    fontSize: getResponsiveValue(18, 20, 22),
    fontWeight: 'bold',
    color: APP_COLORS.darkText,
    textAlign: 'center',
    marginBottom: getResponsiveValue(16, 18, 20),
  },
  breakdownRow: {
    marginBottom: getResponsiveValue(12, 14, 16),
  },
  breakdownItem: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: getResponsiveValue(14, 16, 18),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.darkBorder,
  },
  breakdownLabel: {
    fontSize: getResponsiveValue(14, 15, 16),
    color: APP_COLORS.darkSubtext,
    fontWeight: '500',
    marginBottom: getResponsiveValue(4, 5, 6),
  },
  breakdownValue: {
    fontSize: getResponsiveValue(18, 20, 22),
    fontWeight: 'bold',
    color: APP_COLORS.darkText,
    marginBottom: getResponsiveValue(4, 5, 6),
  },
  bonusValue: {
    color: APP_COLORS.success,
  },
  noBonusValue: {
    color: APP_COLORS.darkSubtext,
  },
  breakdownSubtext: {
    fontSize: getResponsiveValue(12, 13, 14),
    color: APP_COLORS.darkSubtext,
    fontStyle: 'italic',
  },
  divider: {
    height: 2,
    backgroundColor: APP_COLORS.darkBorder,
    marginVertical: getResponsiveValue(16, 18, 20),
    borderRadius: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    padding: getResponsiveValue(16, 18, 20),
    borderRadius: 12,
    borderWidth: 2,
    borderColor: APP_COLORS.primary,
  },
  totalLabel: {
    fontSize: getResponsiveValue(16, 17, 18),
    fontWeight: 'bold',
    color: APP_COLORS.darkText,
  },
  totalValue: {
    fontSize: getResponsiveValue(20, 22, 24),
    fontWeight: 'bold',
  },

  // CV Analysis Container
  cvAnalysisContainer: {
    backgroundColor: APP_COLORS.darkCard,
    padding: getResponsiveValue(20, 24, 28),
    borderRadius: 20,
    marginBottom: getResponsiveValue(16, 20, 24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  cvAnalysisTitle: {
    fontSize: getResponsiveValue(18, 20, 22),
    fontWeight: 'bold',
    color: APP_COLORS.darkText,
    textAlign: 'center',
    marginBottom: getResponsiveValue(16, 18, 20),
  },
  predictionBadge: {
    padding: getResponsiveValue(16, 18, 20),
    borderRadius: 12,
    marginBottom: getResponsiveValue(12, 14, 16),
    alignItems: 'center',
  },
  artisticPrediction: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 2,
    borderColor: APP_COLORS.success,
  },
  nonArtisticPrediction: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 2,
    borderColor: APP_COLORS.danger,
  },
  predictionText: {
    fontSize: getResponsiveValue(16, 17, 18),
    fontWeight: 'bold',
    color: APP_COLORS.darkText,
    marginBottom: getResponsiveValue(4, 5, 6),
  },
  confidenceText: {
    fontSize: getResponsiveValue(14, 15, 16),
    color: APP_COLORS.darkSubtext,
    fontWeight: '600',
  },
  confidenceBar: {
    height: getResponsiveValue(12, 14, 16),
    backgroundColor: APP_COLORS.dark,
    borderRadius: getResponsiveValue(6, 7, 8),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: APP_COLORS.darkBorder,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: getResponsiveValue(6, 7, 8),
  },

  // Buttons
  buttonContainer: {
    marginBottom: getResponsiveValue(20, 24, 28),
  },
  primaryButton: {
    padding: getResponsiveValue(16, 18, 20),
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: getResponsiveValue(12, 14, 16),
    shadowColor: APP_COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: getResponsiveValue(16, 17, 18),
  },
  profileButton: {
    backgroundColor: APP_COLORS.darkCard,
    borderWidth: 2,
    padding: getResponsiveValue(16, 18, 20),
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: getResponsiveValue(12, 14, 16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  profileButtonText: {
    fontWeight: 'bold',
    fontSize: getResponsiveValue(16, 17, 18),
  },
  secondaryButton: {
    backgroundColor: APP_COLORS.darkCard,
    borderWidth: 2,
    borderColor: APP_COLORS.primary,
    padding: getResponsiveValue(16, 18, 20),
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: APP_COLORS.primary,
    fontWeight: 'bold',
    fontSize: getResponsiveValue(16, 17, 18),
  },

  // Summary Container
  summaryContainer: {
    backgroundColor: APP_COLORS.darkCard,
    padding: getResponsiveValue(20, 24, 28),
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  summaryTitle: {
    fontSize: getResponsiveValue(18, 20, 22),
    fontWeight: 'bold',
    color: APP_COLORS.darkText,
    textAlign: 'center',
    marginBottom: getResponsiveValue(16, 18, 20),
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  summaryItem: {
    alignItems: 'center',
    minWidth: '30%',
    marginBottom: getResponsiveValue(12, 14, 16),
  },
  summaryLabel: {
    fontSize: getResponsiveValue(12, 13, 14),
    color: APP_COLORS.darkSubtext,
    fontWeight: '500',
    marginBottom: getResponsiveValue(4, 5, 6),
  },
  summaryValue: {
    fontSize: getResponsiveValue(18, 20, 22),
    fontWeight: 'bold',
    color: APP_COLORS.darkText,
  },
});

export default FinalScoreScreen;