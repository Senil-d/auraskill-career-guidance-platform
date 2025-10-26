import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Animatable from "react-native-animatable";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import BASE_URL from "../config/apiConfig";

const LoginScreen = () => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(30)).current;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔹 Animations for smooth intro
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // 🔹 Handle Login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      // Ensure BASE_URL is correct (not localhost!)
      console.log("🔗 Connecting to:", `${BASE_URL}/api/auth/login`);

      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      console.log("✅ Login Response:", response.data);

      if (response.data?.token) {
        await AsyncStorage.setItem("token", response.data.token);
        Alert.alert("Success", "Login successful!");
        navigation.navigate("Home");
      } else {
        Alert.alert("Login Failed", response.data?.message || "Invalid response from server.");
      }
    } catch (error) {
      console.log("❌ Login Error:", error.response?.data || error.message);
      if (error.response?.status === 401) {
        Alert.alert("Invalid Credentials", "Email or password is incorrect.");
      } else if (error.response?.status === 404) {
        Alert.alert("Account Not Found", "No account found with this email.");
      } else {
        Alert.alert("Error", error.response?.data?.message || "Network or server error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#6A5AE0", "#836FFF"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Animated.View
          style={[
            styles.inner,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateAnim }],
            },
          ]}
        >
          {/* 🎓 Logo + Animation */}
          <View style={styles.logoContainer}>
            <View style={styles.iconCircle}>
              <Animatable.View animation="bounceIn" duration={1500}>
                {LottieView ? (
                  <LottieView
                    source={require("../assets/Welcome.json")} // ⚠️ Must match your actual filename!
                    autoPlay
                    loop
                    style={styles.lottie}
                  />
                ) : (
                  <Text style={styles.fallbackEmoji}>🎓</Text>
                )}
              </Animatable.View>
            </View>

            <Text style={styles.appTitle}>StudyQuest</Text>
            <Text style={styles.tagline}>Level up your learning journey</Text>
          </View>

          {/* 🧾 Login Card */}
          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#888"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <View style={styles.row}>
              <TouchableOpacity onPress={() => setRemember(!remember)}>
                <Text style={styles.remember}>
                  {remember ? "☑" : "☐"} Remember me
                </Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.forgot}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={["#6A5AE0", "#836FFF"]}
                style={styles.gradientButton}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginText}>Start Learning</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.signupText}>
              New to StudyQuest?{" "}
              <Text
                style={styles.signupLink}
                onPress={() => navigation.navigate("SignUp")}
              >
                Sign Up
              </Text>
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

export default LoginScreen;

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
    marginBottom: 40,
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
    width: 170,
    height: 170,
  },
  fallbackEmoji: {
    fontSize: 48,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
  },
  tagline: {
    color: "#EDEAFF",
    fontSize: 14,
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
  label: {
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  input: {
    backgroundColor: "#F7F7F7",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 12,
    marginBottom: 15,
    color: "#000",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  remember: {
    color: "#444",
    fontSize: 14,
  },
  forgot: {
    color: "#6A5AE0",
    fontWeight: "600",
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
  signupText: {
    marginTop: 20,
    textAlign: "center",
    color: "#333",
  },
  signupLink: {
    color: "#6A5AE0",
    fontWeight: "700",
  },
});
