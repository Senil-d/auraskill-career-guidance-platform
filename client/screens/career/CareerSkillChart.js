import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import BASE_URL from "../../config/apiConfig";

const CareerSkillChart = ({ route }) => {
  const { chosenCareer } = route.params;
  const [skillData, setSkillData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          Alert.alert("Authentication Error", "Please log in again.");
          return;
        }

        const res = await axios.post(
          `${BASE_URL}/api/career/choose`,
          { chosenCareer },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setSkillData(res.data);
      } catch (error) {
        console.error("Skill Fetch Error:", error.response?.data || error.message);
        Alert.alert(
          "Error",
          error.response?.data?.message || "Failed to fetch skill data."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, [chosenCareer]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A5AE0" />
        <Text style={{ marginTop: 10, color: "#555" }}>Loading skill chart...</Text>
      </View>
    );
  }

  if (!skillData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: "#555" }}>No data available</Text>
      </View>
    );
  }

  const { requiredSkills, justification } = skillData;

  // Hide zero-value skills
  const filteredSkills = Object.entries(requiredSkills).filter(
    ([, value]) => value > 0
  );

  // Define colors and icons for each skill
  const skillStyles = {
    "Problem-Solving": { color: "#4C8BF5", icon: "cpu", screen: "PSskillAssesment" },
    Analytical: { color: "#F59E0B", icon: "bar-chart-2", screen: "ANskillAssesment" },
    Artistic: { color: "#EC4899", icon: "feather", screen: "ARskillAssesment" },
    Leadership: { color: "#10B981", icon: "users", screen: "LEskillAssesment" },
  };

  return (
    <LinearGradient
      colors={["#6A5AE0", "#836FFF"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Text style={styles.header}>🎯 {skillData.career}</Text>
          <Text style={styles.subText}>Required Skills for Your Career Path</Text>

          {/* Horizontal skill bars */}
          {filteredSkills.map(([skill, value], index) => {
            const { color, icon, screen } = skillStyles[skill] || {};
            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                onPress={() => navigation.navigate(screen)}
              >
                <View style={styles.skillRow}>
                  <View style={styles.skillLabel}>
                    <Icon name={icon} size={20} color={color} />
                    <Text style={[styles.skillText, { color }]}>{skill}</Text>
                  </View>

                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${value}%`, backgroundColor: color },
                      ]}
                    />
                  </View>

                  <Text style={styles.valueText}>{value}%</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Justification section */}
          <Text style={styles.justificationTitle}>💡 Why These Skills?</Text>
          <Text style={styles.justificationText}>{justification}</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default CareerSkillChart;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    width: "100%",
    alignItems: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6A5AE0",
    textAlign: "center",
  },
  subText: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginVertical: 8,
  },
  skillRow: {
    width: "100%",
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  skillLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  skillText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  progressBarContainer: {
    width: "100%",
    height: 10,
    backgroundColor: "#EAEAEA",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 10,
  },
  valueText: {
    textAlign: "right",
    fontSize: 13,
    color: "#444",
    marginTop: 4,
  },
  justificationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6A5AE0",
    marginTop: 25,
    marginBottom: 6,
  },
  justificationText: {
    fontSize: 14,
    color: "#444",
    textAlign: "center",
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
