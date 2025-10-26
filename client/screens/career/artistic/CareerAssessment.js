import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Import your JSON data (you'll need to adjust the path)
import questionsData from '../../data/output.json';
import AssessmentResults from './AssessmentResults';
import FinalScoreScreen from './FinalScoreScreen';

// Career Options (keeping for compatibility with existing code)
const CAREER_OPTIONS = [
  { id: 'ui_ux', name: 'UI/UX Design', riasec: ['Artistic', 'Investigative', 'Social'] },
  { id: 'game_design', name: 'Game Design', riasec: ['Artistic', 'Investigative', 'Realistic'] },
  { id: 'web_development', name: 'Web Development', riasec: ['Investigative', 'Realistic', 'Conventional'] }
];

const APP_COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6', 
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  light: '#f8fafc',
  dark: '#0f172a',
  darkCard: '#1e293b',
  darkBorder: '#334155',
  darkText: '#e2e8f0',
  darkSubtext: '#94a3b8'
};

// RIASEC Personality Types
const RIASEC_TYPES = {
  Realistic: { name: 'Realistic', description: 'Doers - practical, physical, hands-on, tool-oriented' },
  Investigative: { name: 'Investigative', description: 'Thinkers - analytical, intellectual, scientific, explorative' },
  Artistic: { name: 'Artistic', description: 'Creators - creative, intuitive, imaginative, expressive' },
  Social: { name: 'Social', description: 'Helpers - cooperative, supportive, healing, nurturing' },
  Enterprising: { name: 'Enterprising', description: 'Persuaders - competitive, ambitious, energetic, leadership' },
  Conventional: { name: 'Conventional', description: 'Organizers - detail-oriented, structured, organized, clerical' }
};

const TOTAL_QUESTIONS = 30;
const QUESTIONS_PER_TYPE = 5;

const CareerAssessment = ({ route, onAssessmentComplete, onProceedToCV, assessmentResults }) => {
  const navigation = useNavigation();
  const { selectedCareer } = route?.params || {};
  
  const [currentStep, setCurrentStep] = useState('assessment');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scores, setScores] = useState({ 
    Realistic: 0, Investigative: 0, Artistic: 0, 
    Social: 0, Enterprising: 0, Conventional: 0 
  });
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [cvAnalysisResult, setCvAnalysisResult] = useState(null);
  const [showFinalScore, setShowFinalScore] = useState(false);

  // Filter questions by RIASEC type and career stream
  const getQuestionsByType = (type, careerStream, count = QUESTIONS_PER_TYPE) => {
    return questionsData
      .filter(q => q.RIASEC_Type === type && q.Career_Stream === careerStream)
      .sort(() => 0.5 - Math.random())
      .slice(0, count);
  };

  const handleCVAnalysisComplete = (cvResult) => {
    console.log('CV Analysis completed:', cvResult);
    setCvAnalysisResult(cvResult);
    setShowFinalScore(true);
  };

  const handleRetakeAssessment = () => {
    // Reset all state for retaking assessment
    setCurrentStep('assessment');
    setCurrentQuestionIndex(0);
    setScores({ 
      Realistic: 0, Investigative: 0, Artistic: 0, 
      Social: 0, Enterprising: 0, Conventional: 0 
    });
    setTotalCorrect(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsAnswerCorrect(false);
    setCvAnalysisResult(null);
    setShowFinalScore(false);
    
    // Re-setup questions
    if (selectedCareer) {
      setupQuestions(selectedCareer);
    }
  };

  const renderFinalScore = () => {
    const assessmentScore = Math.round((totalCorrect / TOTAL_QUESTIONS) * 10 * 10) / 10;
    
    return (
      <FinalScoreScreen
        assessmentScore={assessmentScore}
        cvPrediction={cvAnalysisResult?.prediction}
        cvConfidence={cvAnalysisResult?.confidence || 0}
        selectedCareer={selectedCareer}
        onNavigateHome={() => navigation.navigate('home')}
        onRetakeAssessment={handleRetakeAssessment}
      />
    );
  };

  // Initialize questions when component mounts
  React.useEffect(() => {
    if (selectedCareer) {
      setupQuestions(selectedCareer);
    } else {
      // Default career if none provided
      const defaultCareer = CAREER_OPTIONS[0];
      setupQuestions(defaultCareer);
    }
  }, [selectedCareer]);

  const setupQuestions = (career) => {
    setLoading(true);
    
    try {
      // Get exactly 5 questions for each RIASEC type in the career
      const careerQuestions = [];
      career.riasec.forEach(type => {
        const typeQuestions = getQuestionsByType(type, career.name, QUESTIONS_PER_TYPE);
        careerQuestions.push(...typeQuestions);
      });
      
      // If we need more questions to reach 30, get from other types in the same career
      if (careerQuestions.length < TOTAL_QUESTIONS) {
        const remaining = TOTAL_QUESTIONS - careerQuestions.length;
        const allQuestions = questionsData
          .filter(q => q.Career_Stream === career.name)
          .sort(() => 0.5 - Math.random())
          .slice(0, remaining);
        
        careerQuestions.push(...allQuestions);
      }
      
      // Ensure we have exactly TOTAL_QUESTIONS
      const finalQuestions = careerQuestions.slice(0, TOTAL_QUESTIONS);
      
      setQuestions(finalQuestions);
    } catch (error) {
      console.error('Error setting up questions:', error);
      Alert.alert('Error', 'Failed to load questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer) => {
    if (showFeedback) return; // Prevent selecting another answer after feedback is shown
    
    setSelectedAnswer(answer);
    
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.Correct_Answer;
    setIsAnswerCorrect(isCorrect);
    setShowFeedback(true);
    
    // Update scores based on correct answer
    if (isCorrect) {
      const newScores = { ...scores };
      newScores[currentQuestion.RIASEC_Type] += 1;
      setScores(newScores);
      setTotalCorrect(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    
    // Move to next question or complete assessment
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      completeAssessment();
    }
  };

  const completeAssessment = () => {

    
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      setCurrentStep('results');
      

      // Don't call onAssessmentComplete here - just show results
    }, 1000);
  };

  // Calculate career compatibility correctly
  const calculateCareerCompatibility = () => {
    const compatibility = {};
    
    CAREER_OPTIONS.forEach(career => {
      let totalScore = 0;
      let totalMaxScore = 0;
      
      career.riasec.forEach(type => {
        const questionsForType = questions.filter(q => q.RIASEC_Type === type);
        const maxScoreForType = questionsForType.length;
        const actualScoreForType = scores[type] || 0;
        
        totalScore += actualScoreForType;
        totalMaxScore += maxScoreForType;
      });
      
      // Calculate percentage, avoid division by zero
      const percentage = totalMaxScore > 0 
        ? Math.round((totalScore / totalMaxScore) * 100)
        : 0;
      
      compatibility[career.id] = percentage;
    });
    
    return compatibility;
  };

  const renderCareerSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Loading Career Assessment</Text>
      <Text style={styles.subtitle}>Preparing questions for {selectedCareer?.name || 'your selected career'}...</Text>
      <ActivityIndicator size="large" color={APP_COLORS.primary} />
    </View>
  );

  const renderAssessment = () => {
    if (loading || questions.length === 0) {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.title}>Preparing Assessment</Text>
          <Text style={styles.subtitle}>Loading questions for {selectedCareer?.name || 'career assessment'}...</Text>
          <ActivityIndicator size="large" color={APP_COLORS.primary} />
          <Text style={styles.loadingText}>Setting up personalized questions...</Text>
        </View>
      );
    }

    const currentQuestion = questions[currentQuestionIndex];
    
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.title}>Career Knowledge Assessment</Text>
        <Text style={styles.subtitle}>Selected Career: {selectedCareer?.name || 'Assessment'}</Text>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {TOTAL_QUESTIONS}
        </Text>
        
        <View style={styles.questionContainer}>
          <Text style={styles.questionType}>
            {currentQuestion.RIASEC_Type} - {currentQuestion.Question_Category}
          </Text>
          <Text style={styles.questionText}>
            {currentQuestion.Question_Text}
          </Text>
        </View>

        <View style={styles.answerOptions}>
          {['A', 'B', 'C', 'D'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.answerOption,
                selectedAnswer === option && styles.selectedAnswer,
                showFeedback && option === currentQuestion.Correct_Answer && styles.correctAnswer,
                showFeedback && selectedAnswer === option && selectedAnswer !== currentQuestion.Correct_Answer && styles.incorrectAnswer
              ]}
              onPress={() => handleAnswerSelect(option)}
              disabled={showFeedback}
            >
              <Text style={[
                styles.answerOptionText,
                showFeedback && option === currentQuestion.Correct_Answer && styles.correctAnswerText,
                showFeedback && selectedAnswer === option && selectedAnswer !== currentQuestion.Correct_Answer && styles.incorrectAnswerText
              ]}>
                {option}. {currentQuestion[`Option_${option}`]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {showFeedback && (
          <View style={[
            styles.feedbackContainer,
            isAnswerCorrect ? styles.correctFeedback : styles.incorrectFeedback
          ]}>
            <Text style={styles.feedbackText}>
              {isAnswerCorrect ? '✓ Correct! ' : '✗ Incorrect! '}
              {currentQuestion.Explanation || 
                (isAnswerCorrect ? 'Well done!' : `The correct answer is ${currentQuestion.Correct_Answer}`)}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, !showFeedback && styles.submitButtonDisabled]}
          onPress={handleNextQuestion}
          disabled={!showFeedback}
        >
          <Text style={styles.submitButtonText}>
            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Assessment'}
          </Text>
        </TouchableOpacity>

        <View style={styles.scoreIndicator}>
          <Text style={styles.scoreIndicatorText}>
            Score: {totalCorrect}/{TOTAL_QUESTIONS}
          </Text>
        </View>

        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100}%` }
            ]} 
          />
        </View>
      </View>
    );
  };

  const renderResults = () => {

    
    const careerCompatibility = calculateCareerCompatibility();
    
    const handleContinueToCV = () => {
      // Navigate to CV analysis with assessment results
      const percentageScore = Math.round((totalCorrect / TOTAL_QUESTIONS) * 100);
      const assessmentScore = Math.round((totalCorrect / TOTAL_QUESTIONS) * 10 * 10) / 10;
      
      const results = {
        selectedCareer,
        riasecScores: scores,
        careerCompatibility,
        totalScore: percentageScore,
        totalQuestions: TOTAL_QUESTIONS,
        totalCorrect: totalCorrect,
        assessmentScoreOut10: assessmentScore
      };
      
      // Navigate to CV classification with assessment results
      navigation.navigate('cv', {
        assessmentResults: results,
        onCVComplete: handleCVAnalysisComplete
      });
    };

    const handleSkipToFinalScore = () => {
      // Show final score without CV analysis
      setShowFinalScore(true);
    };

    return (
      <AssessmentResults
        scores={scores}
        questions={questions}
        totalCorrect={totalCorrect}
        totalQuestions={TOTAL_QUESTIONS}
        careerOptions={CAREER_OPTIONS}
        careerCompatibility={careerCompatibility}
        onContinue={handleContinueToCV}
        onProceedToCV={handleSkipToFinalScore}
        showCVOption={true}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
        <Text style={styles.loadingText}>Calculating your results...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {showFinalScore ? (
        renderFinalScore()
      ) : (
        <>
          {(loading || questions.length === 0) && renderCareerSelection()}
          {!loading && questions.length > 0 && currentStep === 'assessment' && renderAssessment()}
          {currentStep === 'results' && renderResults()}
        </>
      )}
    </ScrollView>
  );
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.dark,
  },
  stepContainer: {
    flex: 1,
    padding: getResponsiveValue(12, 16, 20),
    backgroundColor: APP_COLORS.dark,
  },
  title: {
    fontSize: getResponsiveValue(20, 22, 24),
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: getResponsiveValue(8, 9, 10),
    paddingHorizontal: getResponsiveValue(8, 12, 16),
    textShadowColor: 'rgba(99, 102, 241, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: getResponsiveValue(14, 15, 16),
    color: APP_COLORS.darkSubtext,
    textAlign: 'center',
    marginBottom: getResponsiveValue(20, 25, 30),
    paddingHorizontal: getResponsiveValue(8, 12, 16),
    lineHeight: getResponsiveValue(20, 22, 24),
  },
  careerButton: {
    backgroundColor: APP_COLORS.darkCard,
    padding: getResponsiveValue(18, 20, 22),
    borderRadius: 16,
    marginBottom: getResponsiveValue(12, 14, 16),
    borderWidth: 2,
    borderColor: APP_COLORS.darkBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  selectedCareer: {
    borderColor: APP_COLORS.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    shadowColor: APP_COLORS.primary,
    shadowOpacity: 0.4,
    elevation: 12,
    transform: [{ scale: 1.02 }],
  },
  careerButtonText: {
    fontSize: getResponsiveValue(16, 17, 18),
    fontWeight: 'bold',
    color: APP_COLORS.darkText,
    marginBottom: getResponsiveValue(4, 5, 6),
    textAlign: 'center',
  },
  careerDescription: {
    fontSize: getResponsiveValue(12, 13, 14),
    color: APP_COLORS.darkSubtext,
    textAlign: 'center',
    lineHeight: getResponsiveValue(16, 18, 20),
  },
  progressText: {
    textAlign: 'center',
    color: APP_COLORS.primary,
    marginBottom: getResponsiveValue(16, 18, 20),
    fontSize: getResponsiveValue(14, 15, 16),
    fontWeight: '600',
  },
  questionContainer: {
    backgroundColor: APP_COLORS.darkCard,
    padding: getResponsiveValue(20, 22, 24),
    borderRadius: 20,
    marginBottom: getResponsiveValue(16, 18, 20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.darkBorder,
  },
  questionType: {
    fontSize: getResponsiveValue(12, 13, 14),
    color: APP_COLORS.primary,
    marginBottom: getResponsiveValue(8, 9, 10),
    textAlign: 'center',
    fontWeight: '600',
  },
  questionText: {
    fontSize: getResponsiveValue(16, 17, 18),
    color: APP_COLORS.darkText,
    textAlign: 'center',
    lineHeight: getResponsiveValue(22, 24, 26),
    fontWeight: '500',
  },
  answerOptions: {
    marginBottom: getResponsiveValue(16, 18, 20),
  },
  answerOption: {
    backgroundColor: APP_COLORS.darkCard,
    padding: getResponsiveValue(16, 18, 20),
    borderRadius: 14,
    marginBottom: getResponsiveValue(8, 9, 10),
    borderWidth: 2,
    borderColor: APP_COLORS.darkBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedAnswer: {
    borderColor: APP_COLORS.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    shadowColor: APP_COLORS.primary,
    shadowOpacity: 0.4,
    elevation: 8,
    transform: [{ scale: 1.01 }],
  },
  correctAnswer: {
    borderColor: APP_COLORS.success,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    shadowColor: APP_COLORS.success,
    shadowOpacity: 0.4,
  },
  incorrectAnswer: {
    borderColor: APP_COLORS.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    shadowColor: APP_COLORS.danger,
    shadowOpacity: 0.4,
  },
  answerOptionText: {
    fontSize: getResponsiveValue(14, 15, 16),
    color: APP_COLORS.darkText,
    lineHeight: getResponsiveValue(20, 22, 24),
  },
  correctAnswerText: {
    color: APP_COLORS.success,
    fontWeight: 'bold',
  },
  incorrectAnswerText: {
    color: APP_COLORS.danger,
    fontWeight: 'bold',
  },
  feedbackContainer: {
    padding: getResponsiveValue(16, 18, 20),
    borderRadius: 16,
    marginBottom: getResponsiveValue(16, 18, 20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  correctFeedback: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderLeftWidth: 6,
    borderLeftColor: APP_COLORS.success,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  incorrectFeedback: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderLeftWidth: 6,
    borderLeftColor: APP_COLORS.danger,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  feedbackText: {
    fontSize: getResponsiveValue(14, 15, 16),
    fontWeight: '500',
    lineHeight: getResponsiveValue(20, 22, 24),
    color: APP_COLORS.darkText,
  },
  submitButton: {
    backgroundColor: APP_COLORS.primary,
    padding: getResponsiveValue(16, 18, 20),
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: getResponsiveValue(12, 14, 16),
    shadowColor: APP_COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  submitButtonDisabled: {
    backgroundColor: APP_COLORS.darkBorder,
    shadowOpacity: 0.2,
    elevation: 2,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: getResponsiveValue(15, 16, 17),
  },
  scoreIndicator: {
    backgroundColor: APP_COLORS.darkCard,
    padding: getResponsiveValue(14, 16, 18),
    borderRadius: 16,
    marginBottom: getResponsiveValue(12, 14, 16),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: APP_COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  scoreIndicatorText: {
    fontSize: getResponsiveValue(15, 16, 17),
    fontWeight: 'bold',
    color: APP_COLORS.primary,
  },
  progressBar: {
    height: getResponsiveValue(10, 12, 14),
    backgroundColor: APP_COLORS.darkBorder,
    borderRadius: getResponsiveValue(5, 6, 7),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: APP_COLORS.darkBorder,
  },
  progressFill: {
    height: '100%',
    backgroundColor: APP_COLORS.primary,
    borderRadius: getResponsiveValue(5, 6, 7),
    shadowColor: APP_COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  scoreSummary: {
    backgroundColor: APP_COLORS.darkCard,
    padding: getResponsiveValue(24, 28, 32),
    borderRadius: 24,
    marginBottom: getResponsiveValue(16, 18, 20),
    alignItems: 'center',
    borderWidth: 3,
    borderColor: APP_COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  scoreCircle: {
    width: getResponsiveValue(80, 90, 100),
    height: getResponsiveValue(80, 90, 100),
    borderRadius: getResponsiveValue(40, 45, 50),
    backgroundColor: APP_COLORS.dark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: APP_COLORS.primary,
    marginBottom: getResponsiveValue(12, 14, 15),
    shadowColor: APP_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  scoreCircleText: {
    fontSize: getResponsiveValue(24, 26, 28),
    fontWeight: 'bold',
    color: APP_COLORS.primary,
  },
  scoreMessage: {
    fontSize: getResponsiveValue(18, 19, 20),
    fontWeight: 'bold',
    marginBottom: getResponsiveValue(8, 9, 10),
    textAlign: 'center',
    color: APP_COLORS.darkText,
  },
  detailText: {
    fontSize: getResponsiveValue(14, 15, 16),
    color: APP_COLORS.darkSubtext,
    marginBottom: getResponsiveValue(12, 14, 15),
    textAlign: 'center',
  },
  scoreBreakdown: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    gap: isSmallScreen ? getResponsiveValue(4, 6, 8) : 0,
  },
  breakdownText: {
    fontSize: getResponsiveValue(13, 14, 15),
    color: APP_COLORS.darkSubtext,
  },
  correctText: {
    color: APP_COLORS.success,
    fontWeight: 'bold',
  },
  incorrectText: {
    color: APP_COLORS.danger,
    fontWeight: 'bold',
  },
  resultsSection: {
    backgroundColor: APP_COLORS.darkCard,
    padding: getResponsiveValue(20, 24, 28),
    borderRadius: 20,
    marginBottom: getResponsiveValue(16, 18, 20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: APP_COLORS.darkBorder,
  },
  sectionTitle: {
    fontSize: getResponsiveValue(16, 17, 18),
    fontWeight: 'bold',
    color: APP_COLORS.darkText,
    marginBottom: getResponsiveValue(12, 14, 15),
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveValue(10, 11, 12),
  },
  scoreLabel: {
    width: getResponsiveValue(80, 90, 100),
    fontSize: getResponsiveValue(12, 13, 14),
    color: APP_COLORS.darkText,
    fontWeight: '500',
  },
  scoreBarContainer: {
    flex: 1,
    height: getResponsiveValue(12, 14, 16),
    backgroundColor: APP_COLORS.dark,
    borderRadius: getResponsiveValue(6, 7, 8),
    overflow: 'hidden',
    marginHorizontal: getResponsiveValue(8, 9, 10),
    borderWidth: 1,
    borderColor: APP_COLORS.darkBorder,
  },
  scoreBar: {
    height: '100%',
    borderRadius: getResponsiveValue(6, 7, 8),
    shadowColor: APP_COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  scoreValue: {
    width: getResponsiveValue(40, 45, 50),
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: getResponsiveValue(12, 13, 14),
    color: APP_COLORS.primary,
  },
  careerScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveValue(8, 9, 10),
  },
  careerScoreLabel: {
    flex: 1,
    fontSize: getResponsiveValue(12, 13, 14),
    color: APP_COLORS.darkText,
    fontWeight: '500',
  },
  careerScoreValue: {
    width: getResponsiveValue(40, 45, 50),
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: getResponsiveValue(12, 13, 14),
    color: APP_COLORS.primary,
  },
  primaryButton: {
    backgroundColor: APP_COLORS.primary,
    padding: getResponsiveValue(16, 18, 20),
    borderRadius: 16,
    alignItems: 'center',
    marginTop: getResponsiveValue(8, 9, 10),
    shadowColor: APP_COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: getResponsiveValue(15, 16, 17),
  },
  backButton: {
    marginTop: getResponsiveValue(16, 18, 20),
    padding: getResponsiveValue(10, 11, 12),
    alignItems: 'center',
  },
  backButtonText: {
    color: APP_COLORS.primary,
    fontSize: getResponsiveValue(13, 14, 15),
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsiveValue(32, 36, 40),
    backgroundColor: APP_COLORS.dark,
  },
  loadingText: {
    marginTop: getResponsiveValue(16, 18, 20),
    color: APP_COLORS.darkText,
    fontSize: getResponsiveValue(15, 16, 17),
    textAlign: 'center',
  },
});

export default CareerAssessment;