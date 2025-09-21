import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import BASE_URL from "../config/apiConfig";

const LoginScreen = () => {
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${BASE_URL}/api/auth/login`,
        { email, password }
      );

      if (response.data) {
        await AsyncStorage.setItem("token", response.data.token);
        Alert.alert("Success", "Logged in successfully!");
        navigation.navigate("Home"); // 🔑 Change to your app’s next screen
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Login Failed",
        error.response?.data?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Login to continue 🚀</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#E1C16E" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <Text style={styles.link}>
            Don’t have an account?{" "}
            <Text style={styles.linkBold}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#000000", // Black background
  },
  card: {
    backgroundColor: "#000000",
    padding: 30,
    borderRadius: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    elevation: 6,
    borderColor: "#E1C16E", // Gold accent
    borderWidth: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#E1C16E",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#eee",
    marginBottom: 20,
  },
  input: {
    width: 280,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    marginVertical: 10,
    borderColor: "#E1C16E",
    borderWidth: 2,
  },
  loginButton: {
    backgroundColor: "#000000",
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 30,
    marginTop: 20,
    elevation: 4,
    borderColor: "#E1C16E",
    borderWidth: 2,
  },
  loginButtonText: {
    color: "#E1C16E",
    fontSize: 18,
    fontWeight: "600",
  },
  link: {
    marginTop: 15,
    fontSize: 14,
    color: "#eee",
  },
  linkBold: {
    fontWeight: "bold",
    color: "#E1C16E",
  },
});
