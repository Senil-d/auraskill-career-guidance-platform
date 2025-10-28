import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from "../../../config/apiConfig";

export default function LeadershipResultScreen() {
  const navigation = useNavigation();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeadershipSummary();
  }, []);

  const fetchLeadershipSummary = async () => {
    setLoading(true);
    try {
      // Use JWT from AsyncStorage
      const token = await AsyncStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${BASE_URL}/leadership/summary`, { headers });
      setResults(res.data.results);
    } catch (error) {
      setResults(null);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!results) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>No leadership results available 😕</Text>
        <TouchableOpacity style={styles.button} onPress={fetchLeadershipSummary}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>🏆 Leadership Assessment Results</Text>

      <View style={styles.card}>
        <Text style={styles.scoreLabel}>Overall Score</Text>
        <Text style={styles.scoreValue}>{results.overall_score}/10</Text>
        <Text style={styles.subText}>Level: {results.leadership_level}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📊 Trait Scores</Text>
        <View style={styles.skillRow}>
          <Text style={styles.skillName}>Decision Making</Text>
          <Text style={styles.skillScore}>{results.decision_making}/10</Text>
        </View>
        <View style={styles.skillRow}>
          <Text style={styles.skillName}>Empathy/Communication</Text>
          <Text style={styles.skillScore}>{results.empathy}/10</Text>
        </View>
        <View style={styles.skillRow}>
          <Text style={styles.skillName}>Conflict Management</Text>
          <Text style={styles.skillScore}>{results.conflict_management}/10</Text>
        </View>
        <View style={styles.skillRow}>
          <Text style={styles.skillName}>Strategic Thinking</Text>
          <Text style={styles.skillScore}>{results.strategic_thinking}/10</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📝 Feedback</Text>
        <Text style={styles.textItem}>{results.feedback}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.replace("ReadyScreen")}>
        <Text style={styles.buttonText}>Go to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
  },
  scoreLabel: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  scoreValue: {
    fontSize: 42,
    fontWeight: "800",
    color: "#007AFF",
    textAlign: "center",
    marginVertical: 8,
  },
  subText: {
    textAlign: "center",
    color: "#6B7280",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#111827",
  },
  skillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  skillName: {
    fontSize: 16,
    color: "#374151",
  },
  skillScore: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  textItem: {
    fontSize: 15,
    color: "#374151",
    marginBottom: 5,
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginVertical: 25,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    fontSize: 18,
    color: "#EF4444",
    marginBottom: 10,
  },
});
