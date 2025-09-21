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
import BASE_URL from "../../config/apiConfig";

const CareerSuggestionScreen = () => {
  const navigation = useNavigation();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch suggestions from backend
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          navigation.replace("Login");
          return;
        }

        // Call backend to get suggestions
        const response = await axios.post(
          `${BASE_URL}/api/career/suggest`,
          {}, 
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setSuggestions(response.data.suggestions || []);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        Alert.alert("Error", "Could not load career suggestions");
        navigation.replace("Home");
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  // Save chosen career
  const handleChooseCareer = async (career) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.replace("Login");
        return;
      }

      await axios.post(
        `${BASE_URL}/api/career/choose`,
        { chosenCareer: career },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Success", `Career "${career}" saved to your profile!`);
      navigation.replace("Home");
    } catch (error) {
      console.error("Error saving career:", error);
      Alert.alert("Error", "Could not save your chosen career");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E1C16E" />
        <Text style={{ color: "#E1C16E", marginTop: 10 }}>Loading careers...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🎯 Career Suggestions</Text>
      <Text style={styles.subtitle}>
        Based on your A/L stream and specialization, here are some suitable IT careers:
      </Text>

      {suggestions.map((item, idx) => (
        <View key={idx} style={styles.card}>
          <Text style={styles.cardTitle}>💼 Suggested Careers</Text>
          {item.careers.map((career, cIdx) => (
            <TouchableOpacity
              key={cIdx}
              style={styles.careerButton}
              onPress={() => handleChooseCareer(career)}
            >
              <Text style={styles.careerText}>{career}</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.justificationTitle}>📌 Why?</Text>
          <Text style={styles.justification}>{item.justification}</Text>
        </View>
      ))}

      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => navigation.replace("Home")}
      >
        <Text style={styles.skipText}>Skip for now →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default CareerSuggestionScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#000",
    padding: 20,
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#E1C16E",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#eee",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#111",
    borderColor: "#E1C16E",
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    width: "100%",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E1C16E",
    marginBottom: 10,
  },
  careerButton: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#E1C16E",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 5,
  },
  careerText: {
    color: "#E1C16E",
    fontSize: 16,
    textAlign: "center",
  },
  justificationTitle: {
    fontSize: 16,
    color: "#E1C16E",
    marginTop: 15,
    marginBottom: 5,
    fontWeight: "bold",
  },
  justification: {
    fontSize: 14,
    color: "#eee",
    lineHeight: 20,
  },
  skipButton: {
    marginTop: 15,
  },
  skipText: {
    color: "#E1C16E",
    fontSize: 16,
    textDecorationLine: "underline",
  },
});
