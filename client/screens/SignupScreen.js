import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import BASE_URL from "../config/apiConfig";

const SignUpScreen = () => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSignUp = async () => {
    if (!username || !email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${BASE_URL}/api/auth/register`, {
        username,
        email,
        password,
      });

      if (response.data) {
        await AsyncStorage.setItem("token", response.data.token);
        Alert.alert("Success", "Account created successfully!");
        navigation.navigate("LogIn", { signupData: response.data });
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Registration Failed",
        error.response?.data?.message || "Something went wrong"
      );
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
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join our platform today</Text>

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your username"
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleSignUp}
            disabled={loading}
          >
            <LinearGradient
              colors={["#6A5AE0", "#836FFF"]}
              style={styles.gradientButton}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Sign Up</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.link}>
            Already have an account?{" "}
            <Text
              style={styles.linkBold}
              onPress={() => navigation.navigate("LogIn")}
            >
              Log In
            </Text>
          </Text>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

export default SignUpScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    maxWidth: 380,
    alignSelf: "center",
    padding: 25,
    marginTop: 100,
    marginBottom: 60,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#6A5AE0",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 20,
  },
  label: {
    alignSelf: "flex-start",
    marginLeft: 10,
    fontWeight: "600",
    fontSize: 14,
    color: "#333",
  },
  input: {
    width: "100%",
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 12,
    marginBottom: 15,
    fontSize: 15,
    color: "#333",
  },
  gradientButton: {
    paddingVertical: 14,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loginButton: {
    width: "100%",
    marginTop: 10,
  },
  link: {
    marginTop: 18,
    fontSize: 14,
    color: "#333",
  },
  linkBold: {
    fontWeight: "bold",
    color: "#6A5AE0",
  },
});
