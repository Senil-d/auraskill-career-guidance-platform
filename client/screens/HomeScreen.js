import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import BASE_URL from "../config/apiConfig";

const HomeScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          navigation.replace("Login");
          return;
        }

        const response = await axios.get(`${BASE_URL}/api/auth/get-user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user:", error);
        Alert.alert("Session expired", "Please log in again.");
        navigation.replace("Login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    navigation.replace("Login");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E1C16E" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome, {user?.username || "User"} 👋</Text>
        <Text style={styles.subtitle}>Glad to see you back 🚀</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>📧 Email:</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>📘 A/L Stream:</Text>
          <Text style={styles.infoValue}>
            {user?.AL_stream || "Not selected"}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>💻 Specialization:</Text>
          <Text style={styles.infoValue}>
            {user?.specialization || "Not selected"}
          </Text>
        </View>

        {/* Example navigation buttons */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("LeadershipQuiz")}
        >
          <Text style={styles.buttonText}>Start Quiz</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Profile")}
        >
          <Text style={styles.buttonText}>View Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  card: {
    backgroundColor: "#000",
    padding: 25,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#E1C16E",
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#E1C16E",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#eee",
    marginBottom: 20,
  },
  infoBox: {
    borderWidth: 1,
    borderColor: "#E1C16E",
    borderRadius: 12,
    padding: 10,
    marginVertical: 8,
    width: "100%",
  },
  infoLabel: {
    fontSize: 15,
    color: "#E1C16E",
    fontWeight: "bold",
  },
  infoValue: {
    fontSize: 15,
    color: "#eee",
    marginTop: 4,
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 30,
    marginTop: 15,
    borderColor: "#E1C16E",
    borderWidth: 2,
    elevation: 4,
  },
  buttonText: {
    color: "#E1C16E",
    fontSize: 18,
    fontWeight: "600",
  },
  logoutButton: {
    marginTop: 30,
    borderColor: "#ff4d4d",
    borderWidth: 2,
  },
});
