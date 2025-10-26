import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
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

// App Colors
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

// API Configuration
const API_CONFIG = {
  OCR_BASE_URL: 'http://192.168.134.104:3001',
  BACKEND_URL: BASE_URL,
  CV_MODEL_URL: 'http://192.168.134.104:5001', // CV Classification Model
  ENDPOINTS: {
    OCR: '/api/ocr',
    CLASSIFY: '/api/artistic/classify',
    SAVE_RESULT: '/api/artistic/save-result'
  },
  TIMEOUT: 30000
};

const CVClassification = ({ route }) => {
  const navigation = useNavigation();
  const { assessmentResults, onCVComplete } = route?.params || {};
  
  // State Management
  const [cvText, setCvText] = useState('');
  const [classificationResult, setClassificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasGalleryPermission, setHasGalleryPermission] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Request Gallery Permission
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasGalleryPermission(status === 'granted');
    })();
  }, []);

  // CV Classification Service - Direct call to CV Model
  const classifyCV = async (cvText, assessmentScores = null) => {
    try {
      const requestBody = { text: cvText };
      if (assessmentScores) {
        requestBody.assessment_scores = assessmentScores;
      }

      // Call CV model directly on port 5001
      const response = await axios.post(
        `${API_CONFIG.CV_MODEL_URL}/predict`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: API_CONFIG.TIMEOUT
        }
      );

      return response.data;
    } catch (error) {
      console.error('Classification API Error:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw error;
    }
  };

  // Save Results to Backend
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
      throw error;
    }
  };

  // OCR Text Recognition
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

  // Handle CV Classification
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
      const result = await classifyCV(cvText, assessmentResults?.riasecScores);
      setClassificationResult(result);
      setStatusMessage('CV analysis completed! Saving results...');

      if (assessmentResults) {
        try {
          const saveData = {
            riasecScores: assessmentResults.riasecScores,
            riasecAssessmentScore: assessmentResults.assessmentScoreOut10 || 0,
            totalCorrect: assessmentResults.totalCorrect || 0,
            totalQuestions: assessmentResults.totalQuestions || 30,
            cvText: cvText,
            cvPrediction: result.prediction,
            cvConfidence: result.confidence || 0,
            cvProbabilities: result.probabilities || {}
          };

          const savedResult = await saveArtisticResult(saveData);
          setStatusMessage('Analysis complete and saved! ✓');

          Alert.alert(
            'Success!',
            `CV Analysis Complete!\n\nPrediction: ${result.prediction}\nConfidence: ${Math.round((result.confidence || 0) * 100)}%`,
            [{ text: 'OK' }]
          );
        } catch (saveError) {
          console.error('Failed to save result:', saveError);
          setStatusMessage('Analysis complete (save skipped)');
          // Don't show error alert, just log it
          console.log('Note: Results not saved to database, but CV analysis completed successfully');
        }
      } else {
        // No assessment results, just show CV classification
        Alert.alert(
          'Success!',
          `CV Analysis Complete!\n\nPrediction: ${result.prediction}\nConfidence: ${Math.round((result.confidence || 0) * 100)}%`,
          [{ text: 'OK' }]
        );
      }

      if (onCVComplete) {
        onCVComplete(result);
      }
    } catch (err) {
      console.error('Classification error:', err);
      setStatusMessage('CV analysis failed');
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      Alert.alert(
        'API Error',
        `Failed to analyze CV: ${errorMessage}`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Clear
  const handleClear = () => {
    setCvText('');
    setClassificationResult(null);
    setError('');
    setSelectedImage(null);
    setStatusMessage('');
  };

  // Pick Image from Gallery
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
      }

      if (!imageUri) {
        throw new Error('Could not get image URI');
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
        Alert.alert('OCR Error', 'Please check if the OCR server is running.');
      } finally {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      setStatusMessage('');
      Alert.alert('Gallery Error', 'Failed to pick image from gallery.');
    }
  };

  // Manually Enter Text
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

  // Format Classification Result
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
        <Text style={styles.resultTitle}>✅ CV Analysis Result</Text>

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
            {classificationResult.confidence && (
              <Text style={styles.confidenceText}>
                Confidence: {Math.round(classificationResult.confidence * 100)}%
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  // Permission Check
  if (hasGalleryPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
        <Text style={styles.loadingText}>Requesting permissions...</Text>
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
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      {/* Header */}
      <View style={styles.fixedHeader}>
        <Text style={styles.title}>📄 CV Analysis</Text>
        <Text style={styles.subtitle}>Upload your CV to enhance your final score</Text>
        {assessmentResults && (
          <View style={styles.assessmentSummary}>
            <Text style={styles.summaryText}>
              ✅ Assessment Score: {assessmentResults.assessmentScoreOut10}/10
            </Text>
            <Text style={styles.summaryText}>
              📊 Correct: {assessmentResults.totalCorrect}/{assessmentResults.totalQuestions}
            </Text>
            <Text style={styles.summarySubtext}>
              Add CV for bonus points! 🎨
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
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
        {statusMessage && (
          <View style={[
            styles.statusContainer,
            statusMessage.includes('failed') ? styles.statusError : styles.statusInfo
          ]}>
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={pickImage}
            disabled={loading}
          >
            <Text style={styles.buttonText}>📷 Upload CV Image</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.infoButton]}
            onPress={manuallyEnterText}
            disabled={loading}
          >
            <Text style={styles.buttonText}>✏️ Enter Text</Text>
          </TouchableOpacity>
        </View>

        {/* Skip Button */}
        <TouchableOpacity
          style={[styles.button, styles.warningButton, { width: '100%' }]}
          onPress={() => {
            const assessmentScore = assessmentResults?.assessmentScoreOut10 || 0;
            navigation.navigate('finalscore', {
              assessmentScore: assessmentScore,
              selectedCareer: assessmentResults?.selectedCareer
            });
          }}
          disabled={loading}
        >
          <Text style={styles.buttonText}>⏭️ Skip CV Analysis</Text>
        </TouchableOpacity>

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={APP_COLORS.primary} />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}

        {/* CV Text Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>CV Text Content</Text>
          <TextInput
            style={[styles.textInput, error && styles.inputError]}
            value={cvText}
            onChangeText={(text) => {
              setCvText(text);
              setError('');
            }}
            placeholder="CV text will appear here after extraction..."
            placeholderTextColor={APP_COLORS.darkSubtext}
            multiline={true}
            textAlignVertical="top"
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        {/* Classification Result */}
        {formatClassificationResult()}
      </ScrollView>

      {/* Bottom Action Buttons */}
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
              <Text style={styles.buttonText}>🤖 Analyze CV</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* View Final Score Button */}
        {classificationResult && (
          <TouchableOpacity
            style={styles.finalScoreButton}
            onPress={() => {
              if (onCVComplete) {
                onCVComplete(classificationResult);
              } else {
                const assessmentScore = assessmentResults?.assessmentScoreOut10 || 0;
                navigation.navigate('finalscore', {
                  assessmentScore: assessmentScore,
                  cvPrediction: classificationResult?.prediction,
                  cvConfidence: classificationResult?.confidence || 0,
                  selectedCareer: assessmentResults?.selectedCareer
                });
              }
            }}
          >
            <Text style={styles.finalScoreButtonText}>📊 View Final Score</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Responsive Values
const { width } = Dimensions.get('window');
const isSmallScreen = width < 350;
const getResponsiveValue = (small, medium, large) => {
  if (isSmallScreen) return small;
  if (width <= 400) return medium;
  return large;
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: APP_COLORS.dark,
    paddingTop: Platform.OS === 'ios' ? 44 : 25,
  },
  fixedHeader: {
    backgroundColor: APP_COLORS.dark,
    paddingHorizontal: getResponsiveValue(16, 20, 24),
    paddingVertical: getResponsiveValue(16, 20, 24),
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.darkBorder,
    elevation: 6,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: getResponsiveValue(12, 16, 20),
  },
  fixedBottomContainer: {
    backgroundColor: APP_COLORS.dark,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.darkBorder,
    padding: getResponsiveValue(12, 16, 20),
    elevation: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: APP_COLORS.dark,
  },
  title: {
    fontSize: getResponsiveValue(22, 25, 28),
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: getResponsiveValue(14, 15, 16),
    color: APP_COLORS.darkSubtext,
    textAlign: 'center',
    marginBottom: 6,
  },
  assessmentSummary: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.primary,
  },
  summaryText: {
    fontSize: 13,
    color: APP_COLORS.darkText,
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '600',
  },
  summarySubtext: {
    fontSize: 12,
    color: APP_COLORS.success,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 16,
    alignItems: 'center',
    backgroundColor: APP_COLORS.darkCard,
    borderRadius: 16,
    padding: 10,
    borderWidth: 2,
    borderColor: APP_COLORS.darkBorder,
  },
  imagePreview: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    resizeMode: 'contain',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: APP_COLORS.danger,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  removeImageText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusContainer: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
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
    fontSize: 14,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },
  button: {
    flex: isSmallScreen ? 0 : 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: APP_COLORS.darkText,
  },
  textInput: {
    borderWidth: 2,
    borderColor: APP_COLORS.darkBorder,
    borderRadius: 14,
    padding: 18,
    backgroundColor: APP_COLORS.darkCard,
    fontSize: 15,
    minHeight: 140,
    maxHeight: 180,
    textAlignVertical: 'top',
    color: APP_COLORS.darkText,
  },
  inputError: {
    borderColor: APP_COLORS.danger,
  },
  errorText: {
    color: APP_COLORS.danger,
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: APP_COLORS.primary,
  },
  dangerButton: {
    backgroundColor: APP_COLORS.danger,
  },
  infoButton: {
    backgroundColor: APP_COLORS.info,
  },
  warningButton: {
    backgroundColor: APP_COLORS.warning,
  },
  finalScoreButton: {
    backgroundColor: APP_COLORS.success,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  finalScoreButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 12,
    padding: 24,
    backgroundColor: APP_COLORS.darkCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.darkBorder,
  },
  loadingText: {
    marginTop: 10,
    color: APP_COLORS.darkText,
    fontSize: 14,
    fontWeight: '500',
  },
  resultContainer: {
    backgroundColor: APP_COLORS.darkCard,
    borderRadius: 20,
    padding: 24,
    marginTop: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.darkBorder,
  },
  errorResult: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: APP_COLORS.danger,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: APP_COLORS.primary,
    textAlign: 'center',
  },
  predictionBadge: {
    padding: 20,
    borderRadius: 30,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  designRole: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  nonDesignRole: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  predictionText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: APP_COLORS.dark,
  },
  confidenceText: {
    fontSize: 14,
    color: APP_COLORS.dark,
    marginTop: 6,
  },
});

export default CVClassification;
