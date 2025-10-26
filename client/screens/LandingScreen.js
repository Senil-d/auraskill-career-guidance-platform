import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  AccessibilityInfo,
  ScrollView,
} from "react-native";
import * as Animatable from "react-native-animatable";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import LoadingScreen from "./LoadingScreen";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const LandingScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [reduceMotion, setReduceMotion] = useState(false);
  const titleText = "StudyQuest";

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then((enabled) => {
      setReduceMotion(enabled);
    });

    let index = 0;
    const typingInterval = setInterval(() => {
      if (index < titleText.length) {
        setDisplayedText(titleText.slice(0, index + 1));
        index++;
      } else {
        setTimeout(() => {
          setDisplayedText("");
          index = 0;
        }, 3000);
      }
    }, 100);
    return () => clearInterval(typingInterval);
  }, []);

  const handleNavigate = (screen) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate(screen);
    }, 1000);
  };

  return (
    <LinearGradient
      colors={["#6A5AE0", "#836FFF"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {loading ? (
          <Animatable.View animation="fadeOut" duration={500}>
            <LoadingScreen />
          </Animatable.View>
        ) : (
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.inner}>
              {/* 🧠 Lottie Animation */}
              <Animatable.View
                animation={reduceMotion ? undefined : "bounceIn"}
                duration={1500}
                style={styles.logoContainer}
              >
                <View style={styles.iconCircle}>
                  <LottieView
                    source={require("../assets/Insider-loading.json")}
                    autoPlay={!reduceMotion}
                    loop
                    style={styles.lottie}
                  />
                </View>
              </Animatable.View>

              {/* ✨ Typing Title */}
              <View style={styles.titleContainer}>
                {displayedText.split("").map((letter, index) => (
                  <Animatable.Text
                    key={`${letter}-${index}`}
                    animation={reduceMotion ? undefined : "fadeIn"}
                    duration={300}
                    delay={index * 150}
                    style={styles.title}
                  >
                    {letter}
                  </Animatable.Text>
                ))}
                <Animatable.Text
                  animation={
                    reduceMotion
                      ? undefined
                      : {
                          0: { opacity: 1 },
                          0.5: { opacity: 0 },
                          1: { opacity: 1 },
                        }
                  }
                  iterationCount="infinite"
                  duration={500}
                  style={styles.cursor}
                >
                  ..
                </Animatable.Text>
              </View>

              <Text style={styles.tagline}>Level up your learning journey 🚀</Text>

              {/* 🎯 Button Card Section */}
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => handleNavigate("LogIn")}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#6A5AE0", "#836FFF"]}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.loginText}>Login</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.signupButton}
                  onPress={() => handleNavigate("SignUp")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.signupText}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

export default LandingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconCircle: {
    width: 180,
    height: 180,
    borderRadius: 100,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  lottie: {
    width: 160,
    height: 160,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#fff",
  },
  cursor: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#fff",
  },
  tagline: {
    color: "#EDEAFF",
    fontSize: 16,
    marginTop: 10,
    marginBottom: 25,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "100%",
    maxWidth: 370,
    padding: 25,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  loginButton: {
    marginBottom: 15,
  },
  gradientButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  loginText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  signupButton: {
    borderColor: "#6A5AE0",
    borderWidth: 2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  signupText: {
    color: "#6A5AE0",
    fontWeight: "700",
    fontSize: 16,
  },
});