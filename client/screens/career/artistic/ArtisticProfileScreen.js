import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../../../config/apiConfig';

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

const API_CONFIG = {
  BACKEND_URL: BASE_URL, // Use configured backend URL
  ENDPOINTS: {
    GET_RESULT: '/api/artistic/result'
  }
};

const { width } = Dimensions.get('window');
const isSmallScreen = width < 350;
const isMediumScreen = width >= 350 && width <= 400;

const getResponsiveValue = (small, medium, large) => {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return large;
};

const ArtisticProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [artisticResult, setArtisticResult] = useState(null);
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArtisticResult();
  }, []);

  const fetchArtisticResult = async () => {
    try {
      setError(null);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Error', 'Please login to view your profile');
        navigation.navigate('login');
        return;
      }

      console.log('🔍 Fetching artistic result from backend...');
      
      const response = await axios.get(
        `${API_CONFIG.BACKEND_URL}${API_CONFIG.ENDPOINTS.GET_RESULT}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Artistic result fetched:', response.data);
      
      if (response.data && response.data.result) {
        let result = response.data.result;
        
        // Handle MongoDB Map conversion - traits might be an object or Map
        if (result.traits && typeof result.traits === 'object') {
          // Convert Map-like object to plain object if needed
          if (!Array.isArray(result.traits) && Object.keys(result.traits).length === 0) {
            console.log('⚠️ Traits is empty object');
          }
        }
        
        console.log('📊 Result structure:', JSON.stringify(result, null, 2));
        console.log('📊 Details:', result.details);
        console.log('📊 Traits:', result.traits);
        setArtisticResult(result);
        
        // Set assessment history
        if (response.data.history) {
          console.log('📜 Assessment History:', response.data.history);
          console.log('📊 Total Attempts:', response.data.totalAttempts);
          setAssessmentHistory(response.data.history);
          setTotalAttempts(response.data.totalAttempts || 0);
        }
      }
      
    } catch (err) {
      console.error('❌ Error fetching artistic result:', err.response?.data || err.message);
      
      if (err.response?.status === 404) {
        setError('No artistic assessment found. Please complete the assessment first.');
      } else if (err.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        navigation.navigate('login');
      } else {
        setError(err.response?.data?.message || 'Failed to load assessment results');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchArtisticResult();
  };

  const getLevelInfo = (level) => {
    const levels = {
      'Expert': { emoji: '🌟', color: '#059669', description: 'Outstanding artistic abilities' },
      'Advanced': { emoji: '🎨', color: '#0891b2', description: 'Strong artistic skills' },
      'Intermediate': { emoji: '🎭', color: '#3b82f6', description: 'Good artistic abilities' },
      'Beginner': { emoji: '🖌️', color: '#8b5cf6', description: 'Developing artistic skills' },
      'Novice': { emoji: '🌱', color: '#f59e0b', description: 'Starting artistic journey' }
    };
    return levels[level] || { emoji: '📊', color: APP_COLORS.primary, description: 'Assessment completed' };
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorEmoji}>😔</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchArtisticResult}
        >
          <Text style={styles.retryButtonText}>🔄 Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.assessmentButton}
          onPress={() => navigation.navigate('careerassessment')}
        >
          <Text style={styles.assessmentButtonText}>🎨 Take Assessment</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!artisticResult) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noDataEmoji}>📝</Text>
        <Text style={styles.noDataText}>No assessment data found</Text>
        <Text style={styles.noDataSubtext}>Complete the artistic assessment to see your results here</Text>
        <TouchableOpacity 
          style={styles.assessmentButton}
          onPress={() => navigation.navigate('careerassessment')}
        >
          <Text style={styles.assessmentButtonText}>🎨 Start Assessment</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const levelInfo = getLevelInfo(artisticResult.level);
  const score = artisticResult.overall_score || 0;
  const details = artisticResult.details || {};
  const cvAnalysis = details.cvAnalysis || {};
  
  // Debug logging
  console.log('🔍 Profile Screen Data:');
  console.log('  - Overall Score:', score);
  console.log('  - Level:', artisticResult.level);
  console.log('  - Details object:', details);
  console.log('  - Assessment Score:', details.assessmentScore);
  console.log('  - Assessment Percentage:', details.assessmentPercentage);
  console.log('  - Total Correct:', details.totalCorrect);
  console.log('  - Total Questions:', details.totalQuestions);
  console.log('  - CV Impact:', details.cvImpact);
  console.log('  - CV Analysis:', cvAnalysis);
  console.log('  - Traits:', artisticResult.traits);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={APP_COLORS.primary} />
      }
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🎨 Artistic Assessment Profile</Text>
          <Text style={styles.subtitle}>Your saved results from the database</Text>
        </View>

        {/* Main Score Card */}
        <View style={[styles.scoreCard, { borderColor: levelInfo.color }]}>
          <Text style={styles.levelEmoji}>{levelInfo.emoji}</Text>
          
          <View style={[styles.scoreCircle, { borderColor: levelInfo.color }]}>
            <Text style={[styles.scoreText, { color: levelInfo.color }]}>
              {Math.round(score)}
            </Text>
            <Text style={styles.scoreLabel}>/ 100</Text>
          </View>

          <View style={[styles.levelBadge, { backgroundColor: levelInfo.color }]}>
            <Text style={styles.levelText}>{artisticResult.level || 'N/A'}</Text>
          </View>

          <Text style={styles.levelDescription}>{levelInfo.description}</Text>

          {artisticResult.feedback && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackText}>{artisticResult.feedback}</Text>
            </View>
          )}
        </View>

        {/* RIASEC Traits */}
        {artisticResult.traits && Object.keys(artisticResult.traits).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 RIASEC Traits Breakdown</Text>
            <View style={styles.traitsContainer}>
              {Object.entries(artisticResult.traits).map(([trait, value]) => (
                <View key={trait} style={styles.traitRow}>
                  <Text style={styles.traitName}>{trait}</Text>
                  <View style={styles.traitBarContainer}>
                    <View 
                      style={[
                        styles.traitBar, 
                        { 
                          width: `${(value / 10) * 100}%`,
                          backgroundColor: levelInfo.color 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.traitValue}>{value}/10</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Assessment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Assessment Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Assessment Score:</Text>
            <Text style={styles.detailValue}>
              {details.assessmentScore !== undefined ? details.assessmentScore : 'N/A'}/10 
              ({details.assessmentPercentage !== undefined ? Math.round(details.assessmentPercentage) : 0}%)
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Questions Answered:</Text>
            <Text style={styles.detailValue}>
              {details.totalCorrect !== undefined ? details.totalCorrect : 0}/
              {details.totalQuestions !== undefined ? details.totalQuestions : 30}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>CV Impact:</Text>
            <Text style={[
              styles.detailValue,
              { color: (details.cvImpact || 0) > 0 ? APP_COLORS.success : APP_COLORS.danger }
            ]}>
              {(details.cvImpact || 0) > 0 ? '+' : ''}
              {details.cvImpact !== undefined ? Math.round(details.cvImpact * 10) / 10 : 0}%
            </Text>
          </View>

          {details.calculatedAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Completed:</Text>
              <Text style={styles.detailValue}>
                {new Date(details.calculatedAt).toLocaleDateString()}{' '}
                {new Date(details.calculatedAt).toLocaleTimeString()}
              </Text>
            </View>
          )}
        </View>

        {/* CV Analysis */}
        {cvAnalysis && cvAnalysis.prediction && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔍 CV Analysis Results</Text>
            
            <View style={[
              styles.cvPredictionBadge,
              cvAnalysis.prediction === 'artistic' ? styles.artisticBadge : styles.nonArtisticBadge
            ]}>
              <Text style={styles.cvPredictionText}>
                Classification: {cvAnalysis.prediction}
              </Text>
              <Text style={styles.cvConfidenceText}>
                Confidence: {Math.round((cvAnalysis.confidence || 0) * 100)}%
              </Text>
            </View>

            <View style={styles.confidenceBar}>
              <View 
                style={[
                  styles.confidenceFill,
                  { 
                    width: `${(cvAnalysis.confidence || 0) * 100}%`,
                    backgroundColor: cvAnalysis.prediction === 'artistic' ? APP_COLORS.success : APP_COLORS.danger
                  }
                ]}
              />
            </View>

            {cvAnalysis.probabilities && Object.keys(cvAnalysis.probabilities).length > 0 && (
              <View style={styles.probabilitiesContainer}>
                <Text style={styles.probabilitiesTitle}>Classification Probabilities:</Text>
                {Object.entries(cvAnalysis.probabilities).map(([category, prob]) => (
                  <View key={category} style={styles.probabilityRow}>
                    <Text style={styles.probabilityLabel}>{category}:</Text>
                    <Text style={styles.probabilityValue}>{Math.round(prob * 100)}%</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: levelInfo.color }]}
            onPress={() => navigation.navigate('home')}
          >
            <Text style={styles.primaryButtonText}>🏠 Return to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('careerassessment')}
          >
            <Text style={styles.secondaryButtonText}>🔄 Retake Assessment</Text>
          </TouchableOpacity>
        </View>

        {/* Assessment History */}
        {assessmentHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📜 Assessment History ({totalAttempts} Attempts)</Text>
            <Text style={styles.historySubtitle}>Track your progress over time</Text>
            
            {assessmentHistory.map((attempt, index) => {
              const attemptLevelInfo = getLevelInfo(attempt.level);
              const attemptDetails = attempt.details || {};
              const isLatest = index === assessmentHistory.length - 1;
              
              return (
                <View 
                  key={attempt._id || index} 
                  style={[
                    styles.historyCard,
                    isLatest && styles.latestHistoryCard,
                    { borderLeftColor: attemptLevelInfo.color }
                  ]}
                >
                  <View style={styles.historyHeader}>
                    <View style={styles.historyHeaderLeft}>
                      <Text style={styles.attemptBadge}>
                        Attempt #{attempt.attemptNumber}
                      </Text>
                      {isLatest && (
                        <View style={styles.latestBadge}>
                          <Text style={styles.latestBadgeText}>⭐ Latest</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.historyDate}>
                      {new Date(attempt.completedAt).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.historyContent}>
                    <View style={styles.historyScoreContainer}>
                      <View style={[styles.historyScoreCircle, { borderColor: attemptLevelInfo.color }]}>
                        <Text style={[styles.historyScoreText, { color: attemptLevelInfo.color }]}>
                          {Math.round(attempt.overall_score)}
                        </Text>
                      </View>
                      <View style={styles.historyInfo}>
                        <View style={[styles.historyLevelBadge, { backgroundColor: attemptLevelInfo.color }]}>
                          <Text style={styles.historyLevelText}>
                            {attemptLevelInfo.emoji} {attempt.level}
                          </Text>
                        </View>
                        {attemptDetails.assessmentScore !== undefined && (
                          <Text style={styles.historyDetailText}>
                            Assessment: {attemptDetails.assessmentScore}/10
                          </Text>
                        )}
                        {attemptDetails.cvImpact !== undefined && (
                          <Text style={[
                            styles.historyDetailText,
                            { color: attemptDetails.cvImpact > 0 ? APP_COLORS.success : APP_COLORS.danger }
                          ]}>
                            CV Impact: {attemptDetails.cvImpact > 0 ? '+' : ''}{Math.round(attemptDetails.cvImpact * 10) / 10}%
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Progress Comparison */}
                    {index > 0 && (
                      <View style={styles.progressComparison}>
                        {(() => {
                          const previousScore = assessmentHistory[index - 1].overall_score;
                          const currentScore = attempt.overall_score;
                          const difference = currentScore - previousScore;
                          const isImprovement = difference > 0;
                          
                          return (
                            <View style={[
                              styles.comparisonBadge,
                              { backgroundColor: isImprovement ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
                            ]}>
                              <Text style={[
                                styles.comparisonText,
                                { color: isImprovement ? APP_COLORS.success : APP_COLORS.danger }
                              ]}>
                                {isImprovement ? '⬆️' : '⬇️'} {Math.abs(difference).toFixed(1)} points vs previous
                              </Text>
                            </View>
                          );
                        })()}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  content: {
    padding: getResponsiveValue(16, 20, 24),
  },
  centerContainer: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: APP_COLORS.text,
    fontSize: 16,
    marginTop: 16,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    color: APP_COLORS.danger,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  noDataEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  noDataText: {
    color: APP_COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  noDataSubtext: {
    color: APP_COLORS.subtext,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  assessmentButton: {
    backgroundColor: APP_COLORS.success,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  assessmentButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: getResponsiveValue(24, 26, 28),
    fontWeight: 'bold',
    color: APP_COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: getResponsiveValue(14, 15, 16),
    color: APP_COLORS.subtext,
    textAlign: 'center',
  },
  scoreCard: {
    backgroundColor: APP_COLORS.cardBackground,
    padding: getResponsiveValue(24, 28, 32),
    borderRadius: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  levelEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  scoreCircle: {
    width: getResponsiveValue(120, 140, 160),
    height: getResponsiveValue(120, 140, 160),
    borderRadius: getResponsiveValue(60, 70, 80),
    backgroundColor: APP_COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    marginBottom: 16,
  },
  scoreText: {
    fontSize: getResponsiveValue(36, 40, 44),
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 16,
    color: APP_COLORS.subtext,
    fontWeight: '600',
  },
  levelBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 12,
  },
  levelText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  levelDescription: {
    fontSize: 15,
    color: APP_COLORS.subtext,
    textAlign: 'center',
  },
  feedbackContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(106, 90, 224, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  feedbackText: {
    fontSize: 14,
    color: APP_COLORS.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    backgroundColor: APP_COLORS.cardBackground,
    padding: getResponsiveValue(20, 24, 28),
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_COLORS.text,
    marginBottom: 16,
  },
  traitsContainer: {
    gap: 12,
  },
  traitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  traitName: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.text,
    width: 40,
  },
  traitBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: APP_COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  traitBar: {
    height: '100%',
    borderRadius: 4,
  },
  traitValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: APP_COLORS.text,
    width: 40,
    textAlign: 'right',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
  },
  detailLabel: {
    fontSize: 14,
    color: APP_COLORS.subtext,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: APP_COLORS.text,
    fontWeight: 'bold',
  },
  cvPredictionBadge: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  artisticBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: APP_COLORS.success,
  },
  nonArtisticBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: APP_COLORS.danger,
  },
  cvPredictionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: APP_COLORS.text,
    marginBottom: 4,
  },
  cvConfidenceText: {
    fontSize: 14,
    color: APP_COLORS.subtext,
    fontWeight: '600',
  },
  confidenceBar: {
    height: 12,
    backgroundColor: APP_COLORS.background,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 6,
  },
  probabilitiesContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: APP_COLORS.background,
    borderRadius: 8,
  },
  probabilitiesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_COLORS.subtext,
    marginBottom: 8,
  },
  probabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  probabilityLabel: {
    fontSize: 12,
    color: APP_COLORS.text,
  },
  probabilityValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: APP_COLORS.primary,
  },
  buttonContainer: {
    marginTop: 8,
    gap: 12,
  },
  primaryButton: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: APP_COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: APP_COLORS.light,
    borderWidth: 2,
    borderColor: APP_COLORS.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: APP_COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  historySubtitle: {
    fontSize: 13,
    color: APP_COLORS.subtext,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  historyCard: {
    backgroundColor: APP_COLORS.light,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  latestHistoryCard: {
    backgroundColor: 'rgba(106, 90, 224, 0.05)',
    borderWidth: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attemptBadge: {
    fontSize: 14,
    fontWeight: 'bold',
    color: APP_COLORS.text,
  },
  latestBadge: {
    backgroundColor: APP_COLORS.warning,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  latestBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
  },
  historyDate: {
    fontSize: 12,
    color: APP_COLORS.subtext,
  },
  historyContent: {
    gap: 12,
  },
  historyScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  historyScoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: APP_COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  historyScoreText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  historyInfo: {
    flex: 1,
    gap: 4,
  },
  historyLevelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyLevelText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  historyDetailText: {
    fontSize: 12,
    color: APP_COLORS.darkText,
  },
  progressComparison: {
    marginTop: 8,
  },
  comparisonBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  comparisonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ArtisticProfileScreen;
