import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import BASE_URL from "../../config/apiConfig";

const CareerSkillScreen = () => {
  const navigation = useNavigation();
  const [careerData, setCareerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserCareer = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          navigation.replace("Login");
          return;
        }

        const response = await axios.get(`${BASE_URL}/api/auth/get-user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data && response.data.career) {
          setCareerData({
            career: response.data.career,
            skills: response.data.requiredSkills || {},
            justification: response.data.skillJustification || "",
          });
        } else {
          Alert.alert("No career chosen", "Please choose a career first.");
          navigation.replace("CareerSuggestion");
        }
      } catch (error) {
        console.error("Error fetching career data:", error);
        Alert.alert("Error", "Could not load career information");
      } finally {
        setLoading(false);
      }
    };

    fetchUserCareer();
  }, []);

  const renderSkillBar = (skill, level) => {
    if (level === null || level === undefined || isNaN(level)) return null; // skip missing
    return (
      <View key={skill} style={styles.skillContainer}>
        <Text style={styles.skillLabel}>
          {skill} ({level}/10)
        </Text>
        <View style={styles.barBackground}>
          <View style={[styles.barFill, { width: `${(level / 10) * 100}%` }]} />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E1C16E" />
        <Text style={{ color: "#E1C16E", marginTop: 10 }}>Loading skills...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>🎯 {careerData?.career}</Text>
          <Text style={styles.subtitle}>Required Skills</Text>

          {careerData?.skills &&
            Object.entries(careerData.skills)
              .filter(([_, level]) => level !== null && level !== undefined && !isNaN(level))
              .map(([skill, level]) => renderSkillBar(skill, level))}

          <Text style={styles.justificationTitle}>📌 Why?</Text>
          <Text style={styles.justification}>{careerData?.justification}</Text>
        </View>
      </ScrollView>

      {/* Footer button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.replace("Home")}
        >
          <Text style={styles.homeButtonText}>Continue to Home →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CareerSkillScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  card: {
    backgroundColor: "#111",
    borderColor: "#E1C16E",
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E1C16E",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#eee",
    marginBottom: 20,
    textAlign: "center",
  },
  skillContainer: {
    marginBottom: 15,
  },
  skillLabel: {
    color: "#E1C16E",
    fontSize: 16,
    marginBottom: 5,
  },
  barBackground: {
    height: 12,
    backgroundColor: "#333",
    borderRadius: 6,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#E1C16E",
  },
  justificationTitle: {
    fontSize: 18,
    color: "#E1C16E",
    marginTop: 20,
    marginBottom: 8,
    fontWeight: "bold",
  },
  justification: {
    fontSize: 15,
    color: "#eee",
    lineHeight: 20,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#333",
    padding: 15,
    backgroundColor: "#000",
  },
  homeButton: {
    backgroundColor: "#000",
    borderColor: "#E1C16E",
    borderWidth: 2,
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: "center",
  },
  homeButtonText: {
    color: "#E1C16E",
    fontSize: 16,
    fontWeight: "bold",
  },
});
