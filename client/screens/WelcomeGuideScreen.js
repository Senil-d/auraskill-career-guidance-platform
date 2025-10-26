import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, AccessibilityInfo } from 'react-native';
import * as Animatable from 'react-native-animatable';
import LottieView from 'lottie-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const WelcomeGuideScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [showSignInButton, setShowSignInButton] = useState(false);
  const subtitleText = "This gamified roadmap app guides learners through 15 progressive levels with engaging subtasks, unlocking new challenges step by step, tracking progress, and motivating users with rewards, XP, and milestone achievements";

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then((enabled) => {
      setReduceMotion(enabled);
    });

    if (!reduceMotion) {
      let index = 0;
      const typingInterval = setInterval(() => {
        if (index < subtitleText.length) {
          setDisplayedText(subtitleText.slice(0, index + 1));
          index++;
        } else {
          clearInterval(typingInterval);
          setTimeout(() => {
            setShowSignInButton(true);
          }, 500);
        }
      }, 100);
      return () => clearInterval(typingInterval);
    } else {
      setDisplayedText(subtitleText);
      setShowSignInButton(true);
    }
  }, [reduceMotion]);

  const handleNavigate = (screen) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate(screen);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
        <>
          <View style={styles.subtitleContainer}>
            {displayedText.split('').map((letter, index) => (
              <Animatable.Text
                key={`${letter}-${index}`}
                animation={reduceMotion ? undefined : 'fadeIn'}
                duration={300}
                delay={index * 100}
                style={styles.subtitle}
              >
                {letter}
              </Animatable.Text>
            ))}
          </View>
          {showSignInButton && (
            <Animatable.View
              animation={reduceMotion ? undefined : 'fadeInUp'}
              delay={subtitleText.length * 10 + 500}
              style={styles.buttonContainer}
            >
              <TouchableOpacity
                style={styles.button}
                onPress={() => handleNavigate('LogIn')}
                activeOpacity={8}
                accessibilityLabel="Sign In Button"
                accessibilityRole="button"
              >
                <Text style={styles.buttonText}>Sign In</Text>
              </TouchableOpacity>
            </Animatable.View>
          )}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => handleNavigate('LogIn')}
            activeOpacity={0.8}
            accessibilityLabel="Skip Button"
            accessibilityRole="button"
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </>
    </SafeAreaView>
  );
};

export default WelcomeGuideScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#121212', // Solid dark background
  },
  lottie: {
    width: width * 0.8,
    height: width * 0.8,
    marginBottom: 20,
  },
  title: {
    fontSize: 40,
    fontFamily: 'Digital-7 Mono',
    fontWeight: 'bold',
    color: '#00D4B4',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 6,
    textShadowColor: 'rgba(0, 212, 180, 0.3)',
    textAlign: 'center',
    marginTop: 10,
  },
  subtitleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
    paddingHorizontal: 10,
  },
  subtitle: {
    fontSize: 28,
    fontFamily: 'Poppins-Regular',
    color: '#E0E0E0',
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 40,
  },
  button: {
    backgroundColor: '#E1C16E',
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 30,
    elevation: 6,
    shadowColor: '#E1C16E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#121212',
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    fontWeight: 'bold',
  },
  skipButton: {
    position: 'absolute',
    bottom: 30,
    borderColor: '#E1C16E',
    borderWidth: 3,
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#E1C16E',
    fontWeight: '600',
  },
});