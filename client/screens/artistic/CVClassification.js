import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  ActivityIndicator,
  Image,
  Platform,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../../../config/apiConfig';

// API Configuration
const API_CONFIG = {
  OCR_BASE_URL: 'http://192.168.134.104:3001',
  BACKEND_URL: BASE_URL, // Use configured backend URL
  ARTISTIC_MODEL_URL: 'http://192.168.134.104:5000', // Direct model URL for classification
  ENDPOINTS: {
    OCR: '/api/ocr',
    PREDICT: '/predict',
    CLASSIFY: '/api/artistic/classify', // Backend endpoint
    SAVE_RESULT: '/api/artistic/save-result' // Backend endpoint
  },
  TIMEOUT: 30000
};

// App Colors
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

// CV Classification Service - Using Backend API
const classifyCV = async (cvText, assessmentScores = null) => {
  try {
    // Get auth token (use 'token' key to match LoginScreen)
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please login.');
    }

    const requestBody = {
      text: cvText
    };

    if (assessmentScores) {
      requestBody.assessment_scores = assessmentScores;
    }

    // Call backend classify endpoint
    const response = await axios.post(
      `${API_CONFIG.BACKEND_URL}${API_CONFIG.ENDPOINTS.CLASSIFY}`,
      requestBody,
      { 
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: API_CONFIG.TIMEOUT 
      }
    );

    return response.data;
  } catch (error) {
    console.error('Classification API Error:', error);
    if (error.response?.status === 401) {
      Alert.alert('Authentication Error', 'Please login again.');
    }
    throw error;
  }
};

// Save Assessment Results to Backend
const saveArtisticResult = async (assessmentData) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please login.');
    }

    const response = await axios.post(
      `${API_CONFIG.BACKEND_URL}${API_CONFIG.ENDPOINTS.SAVE_RESULT}`,
      assessmentData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: API_CONFIG.TIMEOUT
      }
    );

    return response.data;
  } catch (error) {
    console.error('Save Result Error:', error);
    if (error.response?.status === 401) {
      Alert.alert('Authentication Error', 'Please login again.');
    }
    throw error;
  }
};

// Text Recognition with OCR
const recognizeTextFromImage = async (imageUri) => {
  try {
    if (!imageUri) {
      throw new Error('No image URI provided');
    }

    const formData = new FormData();
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri: imageUri,
      type: type,
      name: filename || 'cv.jpg'
    });

    const response = await axios.post(
      `${API_CONFIG.OCR_BASE_URL}${API_CONFIG.ENDPOINTS.OCR}`,
      formData,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        timeout: API_CONFIG.TIMEOUT
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'OCR processing failed');
    }

    return response.data.text;
  } catch (error) {
    console.error('OCR error:', error);
    throw new Error(`OCR failed: ${error.message}`);
  }
};

const CVClassification = ({ route, onBack, assessmentResults, onUpdateFinalScore }) => {
  const navigation = useNavigation();
  const { onCVComplete, assessmentResults: routeAssessmentResults } = route?.params || {};
  const finalAssessmentResults = assessmentResults || routeAssessmentResults;
  const [cvText, setCvText] = useState('');
  const [classificationResult, setClassificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasGalleryPermission, setHasGalleryPermission] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasGalleryPermission(status === 'granted');
    })();
  }, []);

  const handleClassifyCV = async () => {
    if (!cvText.trim()) {
      setError('CV text cannot be empty');
      return;
    }

    setLoading(true);
    setError('');
    setClassificationResult(null);
    setStatusMessage('Analyzing CV content...');

    try {
      // Step 1: Classify CV using backend API
      const result = await classifyCV(cvText, finalAssessmentResults?.riasecScores);
      setClassificationResult(result);
      setStatusMessage('CV analysis completed! Saving results...');
      
      console.log('CV Classification Result:', {
        prediction: result.prediction,
        isArtistic: result.prediction?.toLowerCase() === 'artistic',
        hasAssessmentResults: !!finalAssessmentResults,
        assessmentScore: finalAssessmentResults?.assessmentScoreOut10
      });
      
      // Step 2: Save complete assessment result to database
      if (finalAssessmentResults) {
        try {
          const saveData = {
            riasecScores: finalAssessmentResults.riasecScores,
            riasecAssessmentScore: finalAssessmentResults.assessmentScoreOut10 || 0,
            totalCorrect: finalAssessmentResults.totalCorrect || 0,
            totalQuestions: finalAssessmentResults.totalQuestions || 30,
            cvText: cvText,
            cvPrediction: result.prediction,
            cvConfidence: result.confidence || 0,
            cvProbabilities: result.probabilities || {}
          };

          const savedResult = await saveArtisticResult(saveData);
          console.log('Result saved to database:', savedResult);
          setStatusMessage('Analysis complete and saved! ✓');
          
          Alert.alert(
            'Success!',
            `Your artistic assessment has been saved!\n\nFinal Score: ${savedResult.finalScore?.finalScore || 'N/A'}/100\nLevel: ${savedResult.finalScore?.level || 'N/A'}`,
            [{ text: 'OK' }]
          );
        } catch (saveError) {
          console.error('Failed to save result:', saveError);
          setStatusMessage('Analysis complete but save failed');
          Alert.alert(
            'Warning',
            'CV analysis completed but could not save to database. Results will not be persistent.',
            [{ text: 'OK' }]
          );
        }
      }
      
      // Calculate final score when CV analysis is complete
      if (finalAssessmentResults && onUpdateFinalScore) {
        onUpdateFinalScore(result);
      }
      
      // Call the completion callback if provided
      if (onCVComplete) {
        onCVComplete(result);
      }
    } catch (err) {
      console.error('Classification error:', err);
      setStatusMessage('CV analysis failed');
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      Alert.alert(
        'API Error', 
        `Failed to analyze CV: ${errorMessage}\n\nPlease check your connection and try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCvText('');
    setClassificationResult(null);
    setError('');
    setSelectedImage(null);
    setStatusMessage('');
  };

  const pickImage = async () => {
    try {
      setStatusMessage('Selecting CV image...');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
        base64: false
      });

      if (result.cancelled) {
        setStatusMessage('');
        return;
      }
      
      let imageUri = null;
      if (result.assets && result.assets.length > 0) {
        imageUri = result.assets[0].uri;
      } else if (result.uri) {
        imageUri = result.uri;
      } else {
        throw new Error('Could not get image URI from response');
      }

      if (!imageUri) {
        throw new Error('Image URI is null or undefined');
      }

      setSelectedImage(imageUri);
      
      setLoading(true);
      setError('');
      setStatusMessage('Extracting text from CV...');
      
      try {
        const recognizedText = await recognizeTextFromImage(imageUri);
        setCvText(recognizedText);
        setStatusMessage('Text extraction completed!');
      } catch (err) {
        console.error('OCR processing error:', err);
        setError(err.message);
        setStatusMessage('Text extraction failed');
        Alert.alert('OCR Error', 'Please check if the OCR server is running at ' + API_CONFIG.OCR_BASE_URL);
      } finally {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      setStatusMessage('');
      Alert.alert('Gallery Error', 'Failed to pick image from gallery: ' + err.message);
    }
  };

  const manuallyEnterText = () => {
    Alert.prompt(
      'Enter CV Text',
      'Paste the text from your CV:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: (text) => {
            if (text && text.trim()) {
              setCvText(text);
              setSelectedImage(null);
              setError('');
              setStatusMessage('');
            }
          },
        },
      ],
      'plain-text',
      cvText
    );
  };

  const formatClassificationResult = () => {
    if (!classificationResult) return null;
    
    if (classificationResult.error) {
      return (
        <View style={[styles.resultContainer, styles.errorResult]}>
          <Text style={styles.resultTitle}>Error</Text>
          <Text style={styles.errorText}>{classificationResult.error}</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>CV Analysis Result</Text>
        
        {assessmentResults && (
          <View style={styles.assessmentResults}>
            <Text style={styles.sectionTitle}>Career Assessment Results</Text>
            <Text style={styles.assessmentText}>
              Preferred Career: {assessmentResults.selectedCareer?.name || 'N/A'}
            </Text>
            <Text style={styles.assessmentText}>
              Assessment Score: {assessmentResults.assessmentScoreOut10 || 0}/10
            </Text>
            {assessmentResults.finalScoreData && (
              <View style={styles.finalScoreSection}>
                <Text style={styles.finalScoreTitle}>🎯 Final Combined Score</Text>
                <View style={styles.scoreBreakdown}>
                  <Text style={styles.scoreBreakdownText}>
                    Assessment: {assessmentResults.finalScoreData.assessmentScore}/10
                  </Text>
                  {assessmentResults.finalScoreData.bonusPoints > 0 ? (
                    <Text style={[styles.scoreBreakdownText, styles.bonusText]}>
                      + Bonus: {assessmentResults.finalScoreData.bonusPoints} ({assessmentResults.finalScoreData.bonusReason})
                    </Text>
                  ) : (
                    <Text style={[styles.scoreBreakdownText, styles.noBonusText]}>
                      + Bonus: 0 (CV classified as non-artistic)
                    </Text>
                  )}
                  <View style={[styles.finalScoreBadge, { backgroundColor: assessmentResults.finalScoreData.level.color }]}>
                    <Text style={styles.finalScoreValue}>
                      Final Score: {assessmentResults.finalScoreData.finalScore}/10
                    </Text>
                    <Text style={styles.finalScoreLevel}>
                      Level: {assessmentResults.finalScoreData.level.name}
                    </Text>
                  </View>
                </View>
                <Text style={styles.levelDescription}>
                  {assessmentResults.finalScoreData.level.description}
                </Text>
              </View>
            )}
            <Text style={styles.assessmentText}>
              Compatibility: {Math.round(assessmentResults.careerCompatibility?.[assessmentResults.selectedCareer?.id] || 0)}%
            </Text>
          </View>
        )}
        
        {classificationResult.prediction && (
          <View style={[
            styles.predictionBadge,
            classificationResult.prediction.toLowerCase().includes('artistic') || 
            classificationResult.prediction.toLowerCase().includes('design') ? 
            styles.designRole : styles.nonDesignRole
          ]}>
            <Text style={styles.predictionText}>
              {classificationResult.prediction}
            </Text>
          </View>
        )}
        
        {classificationResult.assessment_impact && (
          <View style={styles.assessmentImpact}>
            <Text style={styles.sectionTitle}>Assessment Impact:</Text>
            <View style={[
              styles.impactBadge,
              classificationResult.assessment_impact === 'Positive' ? styles.positiveImpact : styles.neutralImpact
            ]}>
              <Text style={styles.impactText}>
                {classificationResult.assessment_impact}
              </Text>
              <Text style={styles.impactDescription}>
                {classificationResult.assessment_impact === 'Positive' 
                  ? 'Your assessment results improved the prediction'
                  : 'Assessment had neutral impact on prediction'}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (hasGalleryPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
        <Text>Requesting permissions...</Text>
      </View>
    );
  }

  if (hasGalleryPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Permission to access gallery is required!</Text>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => ImagePicker.requestMediaLibraryPermissionsAsync()}
        >
          <Text style={styles.buttonText}>Grant Permissions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.infoButton, {marginTop: 10}]}
          onPress={manuallyEnterText}
        >
          <Text style={styles.buttonText}>Enter Text Manually</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={APP_COLORS.light} />
      
      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        <Text style={styles.title}>CV Analysis</Text>
        <Text style={styles.subtitle}>Upload your CV to enhance your final score</Text>
        {finalAssessmentResults && (
          <View style={styles.assessmentSummary}>
            <Text style={styles.summaryText}>
              ✅ Assessment Score: {finalAssessmentResults.assessmentScoreOut10}/10
            </Text>
            <Text style={styles.summaryText}>
              📊 Correct Answers: {finalAssessmentResults.totalCorrect}/{finalAssessmentResults.totalQuestions}
            </Text>
            <Text style={styles.summarySubtext}>
              Add CV analysis for bonus points!
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={true}
          bounces={false}
        >
          {/* Image Preview */}
          {selectedImage && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => {
                  setSelectedImage(null);
                  setCvText('');
                  setStatusMessage('');
                }}
              >
                <Text style={styles.removeImageText}>×</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Status Message */}
          {statusMessage ? (
            <View style={[
              styles.statusContainer, 
              statusMessage.includes('failed') ? styles.statusError : styles.statusInfo
            ]}>
              <Text style={styles.statusText}>{statusMessage}</Text>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={pickImage}
              disabled={loading}
            >
              <Text style={styles.buttonText}>📄 Upload CV Image</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.infoButton]}
              onPress={manuallyEnterText}
              disabled={loading}
            >
              <Text style={styles.buttonText}>✏️ Enter CV Text</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.warningButton]}
              onPress={() => {
                // Skip CV and go directly to final score
                if (route?.params?.onBack) {
                  route.params.onBack();
                  navigation.goBack();
                } else {
                  const assessmentScore = finalAssessmentResults?.assessmentScoreOut10 || 0;
                  navigation.navigate('finalscore', {
                    assessmentScore: assessmentScore,
                    selectedCareer: finalAssessmentResults?.selectedCareer
                  });
                }
              }}
              disabled={loading}
            >
              <Text style={styles.buttonText}>⏭️ Skip CV Analysis</Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={APP_COLORS.primary} />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>CV Text Content</Text>
            <TextInput
              style={[
                styles.textInput,
                error ? styles.inputError : null
              ]}
              value={cvText}
              onChangeText={(text) => {
                setCvText(text);
                setError('');
              }}
              placeholder="CV text will appear here after extraction..."
              multiline={true}
              textAlignVertical="top"
              scrollEnabled={true}
              maxHeight={150}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          {formatClassificationResult()}
        </ScrollView>

        {/* Fixed Bottom Buttons */}
        <View style={styles.fixedBottomContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.dangerButton, loading && styles.disabledButton]}
              onPress={handleClear}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Clear All</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, loading && styles.disabledButton]}
              onPress={handleClassifyCV}
              disabled={loading || !cvText.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Analyze CV</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {classificationResult && (
            <View style={styles.finalScoreButtonContainer}>
              <TouchableOpacity
                style={styles.finalScoreButton}
                onPress={() => {
                  console.log('View Final Score button pressed');
                  if (onCVComplete) {
                    console.log('Calling onCVComplete with:', classificationResult);
                    onCVComplete(classificationResult);
                  } else {
                    console.log('onCVComplete callback not available, navigating directly to final score');
                    // Fallback: Navigate directly to final score screen
                    const assessmentScore = finalAssessmentResults?.assessmentScoreOut10 || 7; // Default score if not available
                    navigation.navigate('finalscore', {
                      assessmentScore: assessmentScore,
                      cvPrediction: classificationResult?.prediction,
                      cvConfidence: classificationResult?.confidence || 0,
                      selectedCareer: finalAssessmentResults?.selectedCareer || { name: 'Artistic Career' }
                    });
                  }
                }}
              >
                <Text style={styles.finalScoreButtonText}>📊 View Final Score</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

// Styles
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
  safeArea: {
    flex: 1,
    backgroundColor: APP_COLORS.dark,
    paddingTop: Platform.OS === 'ios' ? 44 : 25,
  },
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.dark,
  },
  fixedHeader: {
    backgroundColor: APP_COLORS.dark,
    paddingHorizontal: getResponsiveValue(16, 20, 24),
    paddingVertical: getResponsiveValue(16, 20, 24),
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.darkBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: getResponsiveValue(12, 16, 20),
    paddingTop: getResponsiveValue(8, 12, 16),
    paddingBottom: getResponsiveValue(20, 24, 28),
  },
  fixedBottomContainer: {
    backgroundColor: APP_COLORS.dark,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.darkBorder,
    paddingHorizontal: getResponsiveValue(12, 16, 20),
    paddingVertical: getResponsiveValue(12, 14, 16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsiveValue(16, 18, 20),
    backgroundColor: APP_COLORS.dark,
  },
  header: {
    marginBottom: getResponsiveValue(20, 24, 28),
    marginTop: getResponsiveValue(8, 10, 12),
    alignItems: 'center',
    paddingHorizontal: getResponsiveValue(8, 12, 16),
    paddingVertical: getResponsiveValue(16, 20, 24),
    backgroundColor: 'rgba(67, 97, 238, 0.03)',
    borderRadius: 16,
    marginHorizontal: getResponsiveValue(4, 6, 8),
  },
  title: {
    fontSize: getResponsiveValue(22, 25, 28),
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: getResponsiveValue(4, 5, 6),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: getResponsiveValue(14, 15, 16),
    color: APP_COLORS.darkSubtext,
    textAlign: 'center',
    marginBottom: getResponsiveValue(4, 5, 6),
    paddingHorizontal: getResponsiveValue(4, 8, 12),
  },
  demoNote: {
    fontSize: getResponsiveValue(12, 13, 14),
    color: APP_COLORS.success,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: getResponsiveValue(8, 12, 16),
    fontWeight: '600',
  },
  assessmentSummary: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: getResponsiveValue(12, 14, 16),
    marginTop: getResponsiveValue(8, 10, 12),
    borderWidth: 1,
    borderColor: APP_COLORS.primary,
  },
  summaryText: {
    fontSize: getResponsiveValue(13, 14, 15),
    color: APP_COLORS.darkText,
    textAlign: 'center',
    marginBottom: getResponsiveValue(4, 5, 6),
    fontWeight: '600',
  },
  summarySubtext: {
    fontSize: getResponsiveValue(12, 13, 14),
    color: APP_COLORS.success,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: getResponsiveValue(4, 5, 6),
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: getResponsiveValue(12, 14, 16),
    alignItems: 'center',
    backgroundColor: APP_COLORS.darkCard,
    borderRadius: 16,
    padding: getResponsiveValue(8, 10, 12),
    borderWidth: 2,
    borderColor: APP_COLORS.darkBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  imagePreview: {
    width: '100%',
    height: getResponsiveValue(180, 220, 250),
    borderRadius: 12,
    resizeMode: 'contain',
    backgroundColor: APP_COLORS.dark,
    borderWidth: 1,
    borderColor: APP_COLORS.darkBorder,
  },
  removeImageButton: {
    position: 'absolute',
    top: getResponsiveValue(8, 10, 12),
    right: getResponsiveValue(8, 10, 12),
    backgroundColor: '#ef4444',
    width: getResponsiveValue(28, 30, 32),
    height: getResponsiveValue(28, 30, 32),
    borderRadius: getResponsiveValue(14, 15, 16),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  removeImageText: {
    color: 'white',
    fontSize: getResponsiveValue(18, 20, 22),
    fontWeight: 'bold',
  },
  statusContainer: {
    padding: getResponsiveValue(12, 14, 16),
    borderRadius: 12,
    marginBottom: getResponsiveValue(12, 14, 16),
    marginHorizontal: getResponsiveValue(4, 6, 8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  statusInfo: {
    backgroundColor: APP_COLORS.info,
  },
  statusError: {
    backgroundColor: APP_COLORS.danger,
  },
  statusText: {
    color: 'white',
    textAlign: 'center',
    fontSize: getResponsiveValue(13, 14, 15),
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    justifyContent: 'space-between',
    marginVertical: getResponsiveValue(8, 10, 12),
    gap: getResponsiveValue(8, 10, 12),
  },
  button: {
    flex: isSmallScreen ? 0 : 1,
    padding: getResponsiveValue(14, 16, 18),
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: isSmallScreen ? 0 : getResponsiveValue(4, 5, 6),
    minHeight: getResponsiveValue(48, 52, 56),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputContainer: {
    marginBottom: getResponsiveValue(12, 14, 16),
  },
  label: {
    fontSize: getResponsiveValue(15, 16, 17),
    fontWeight: '600',
    marginBottom: getResponsiveValue(6, 7, 8),
    color: APP_COLORS.darkText,
  },
  textInput: {
    borderWidth: 2,
    borderColor: APP_COLORS.darkBorder,
    borderRadius: 14,
    padding: getResponsiveValue(16, 18, 20),
    backgroundColor: APP_COLORS.darkCard,
    fontSize: getResponsiveValue(14, 15, 16),
    minHeight: getResponsiveValue(120, 140, 160),
    maxHeight: getResponsiveValue(150, 180, 200),
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    color: APP_COLORS.darkText,
  },
  inputError: {
    borderColor: APP_COLORS.danger,
    borderWidth: 2,
  },
  errorText: {
    color: APP_COLORS.danger,
    fontSize: getResponsiveValue(13, 14, 15),
    marginTop: getResponsiveValue(4, 5, 6),
    textAlign: 'center',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: APP_COLORS.primary,
    shadowColor: APP_COLORS.primary,
  },
  dangerButton: {
    backgroundColor: APP_COLORS.danger,
    shadowColor: APP_COLORS.danger,
  },
  infoButton: {
    backgroundColor: APP_COLORS.info,
    shadowColor: APP_COLORS.info,
  },
  warningButton: {
    backgroundColor: APP_COLORS.warning,
    shadowColor: APP_COLORS.warning,
  },
  successButton: {
    backgroundColor: APP_COLORS.success,
    shadowColor: APP_COLORS.success,
  },
  finalScoreButtonContainer: {
    marginTop: getResponsiveValue(12, 14, 16),
    paddingTop: getResponsiveValue(8, 10, 12),
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  finalScoreButton: {
    backgroundColor: APP_COLORS.success,
    paddingHorizontal: getResponsiveValue(20, 24, 28),
    paddingVertical: getResponsiveValue(16, 18, 20),
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: APP_COLORS.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  finalScoreButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: getResponsiveValue(16, 17, 18),
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: getResponsiveValue(14, 15, 16),
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: getResponsiveValue(10, 12, 14),
    padding: getResponsiveValue(20, 24, 28),
    backgroundColor: APP_COLORS.darkCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.darkBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  loadingText: {
    marginTop: getResponsiveValue(8, 10, 12),
    color: APP_COLORS.darkText,
    fontSize: getResponsiveValue(13, 14, 15),
    fontWeight: '500',
  },
  resultContainer: {
    backgroundColor: APP_COLORS.darkCard,
    borderRadius: 20,
    padding: getResponsiveValue(20, 24, 28),
    marginTop: getResponsiveValue(16, 18, 20),
    borderWidth: 1,
    borderColor: APP_COLORS.darkBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  errorResult: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: APP_COLORS.danger,
  },
  resultTitle: {
    fontSize: getResponsiveValue(20, 21, 22),
    fontWeight: 'bold',
    marginBottom: getResponsiveValue(16, 18, 20),
    color: APP_COLORS.primary,
    textAlign: 'center',
  },
  assessmentResults: {
    backgroundColor: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)',
    padding: getResponsiveValue(18, 20, 22),
    borderRadius: 16,
    marginBottom: getResponsiveValue(16, 18, 20),
    borderWidth: 2,
    borderColor: '#a5b4fc',
    shadowColor: '#4338ca',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: getResponsiveValue(16, 17, 18),
    fontWeight: 'bold',
    color: APP_COLORS.dark,
    marginBottom: getResponsiveValue(10, 11, 12),
    textAlign: 'center',
  },
  assessmentText: {
    fontSize: getResponsiveValue(14, 15, 16),
    color: APP_COLORS.dark,
    marginBottom: getResponsiveValue(5, 6, 7),
    fontWeight: '500',
  },
  predictionBadge: {
    padding: getResponsiveValue(18, 20, 22),
    borderRadius: 30,
    marginBottom: getResponsiveValue(16, 18, 20),
    alignSelf: 'center',
    minWidth: getResponsiveValue('90%', '85%', '80%'),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  designRole: {
    backgroundColor: '#dcfce7',
    borderWidth: 2,
    borderColor: '#22c55e',
    shadowColor: '#22c55e',
  },
  nonDesignRole: {
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  predictionText: {
    fontSize: getResponsiveValue(16, 17, 18),
    fontWeight: 'bold',
    textAlign: 'center',
    color: APP_COLORS.dark,
  },
  assessmentImpact: {
    marginBottom: getResponsiveValue(12, 14, 16),
  },
  impactBadge: {
    padding: getResponsiveValue(16, 18, 20),
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  positiveImpact: {
    backgroundColor: '#dcfce7',
    borderWidth: 2,
    borderColor: '#22c55e',
    shadowColor: '#22c55e',
  },
  neutralImpact: {
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#f59e0b',
    shadowColor: '#f59e0b',
  },
  impactText: {
    fontSize: getResponsiveValue(16, 17, 18),
    fontWeight: 'bold',
    marginBottom: getResponsiveValue(4, 5, 6),
  },
  impactDescription: {
    fontSize: getResponsiveValue(12, 13, 14),
    textAlign: 'center',
    color: APP_COLORS.dark,
  },
  
  // Final Score Styles
  finalScoreSection: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: getResponsiveValue(16, 18, 20),
    marginVertical: getResponsiveValue(12, 14, 16),
    borderWidth: 2,
    borderColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  finalScoreTitle: {
    fontSize: getResponsiveValue(16, 17, 18),
    fontWeight: 'bold',
    color: '#0c4a6e',
    textAlign: 'center',
    marginBottom: getResponsiveValue(12, 14, 16),
  },
  scoreBreakdown: {
    marginBottom: getResponsiveValue(10, 12, 14),
  },
  scoreBreakdownText: {
    fontSize: getResponsiveValue(13, 14, 15),
    color: '#374151',
    marginBottom: getResponsiveValue(4, 5, 6),
    fontWeight: '500',
  },
  bonusText: {
    color: '#059669',
    fontWeight: 'bold',
  },
  noBonusText: {
    color: '#6b7280',
    fontStyle: 'italic',
  },
  finalScoreBadge: {
    padding: getResponsiveValue(12, 14, 16),
    borderRadius: 12,
    marginTop: getResponsiveValue(8, 10, 12),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  finalScoreValue: {
    color: 'white',
    fontSize: getResponsiveValue(16, 17, 18),
    fontWeight: 'bold',
    marginBottom: getResponsiveValue(2, 3, 4),
  },
  finalScoreLevel: {
    color: 'white',
    fontSize: getResponsiveValue(14, 15, 16),
    fontWeight: '600',
  },
  levelDescription: {
    fontSize: getResponsiveValue(12, 13, 14),
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: getResponsiveValue(16, 18, 20),
  },
});

export default CVClassification;