// ------------------------------------------------------------
// ResultScreen.js
// ------------------------------------------------------------
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import BASE_URL from "../../../../config/apiConfig";

export default function ResultScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { summary } = route.params || {};
  const [saving, setSaving] = useState(false);

  if (!summary) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>No results available 😕</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.replace("ProblemSolvingQuizScreen")}
        >
          <Text style={styles.buttonText}>Retry Quiz</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {
    overall_score,
    total_questions,
    subskill_summary,
    strengths = [],
    improvements = [],
  } = summary;

  // ------------------------------------------------------------
  // 💾 Save Results to Backend (userSchema.results)
  // ------------------------------------------------------------
  const saveResults = async () => {
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Session Expired", "Please log in again.");
        navigation.replace("LoginScreen");
        return;
      }

      const payload = {
        category: "problem_solving",
        summary: {
          traits: summary.subskill_summary || {},
          overall_score: summary.overall_score || 0,
          level: summary.level || "Intermediate",
          feedback:
            summary.feedback ||
            "Continue improving your weaker areas to reach the next level.",
        },
      };

      console.log("📤 Saving quiz result:", payload);

      const res = await axios.post(`${BASE_URL}/api/problemsolving/save-result`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Result saved:", res.data);
      Alert.alert("Success", "Your results have been saved successfully!");
      navigation.replace("Home");
    } catch (error) {
      console.error("❌ Save result error:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to save your quiz results.");
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------------------------
  // 🧠 Render Summary
  // ------------------------------------------------------------
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>🎉 Quiz Completed!</Text>

      {/* Overall Score */}
      <View style={styles.card}>
        <Text style={styles.scoreLabel}>Overall Score</Text>
        <Text style={styles.scoreValue}>{overall_score}%</Text>
        <Text style={styles.subText}>Total Questions: {total_questions}</Text>
      </View>

      {/* Sub-Skill Performance */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📊 Sub-Skill Performance</Text>
        {subskill_summary &&
          Object.keys(subskill_summary).map((skill, i) => {
            const s = subskill_summary[skill];
            const score =
              typeof s === "object" && s.score !== undefined ? s.score : s;
            const attempts =
              typeof s === "object" ? s.questions_attempted : undefined;
            const maxDiff =
              typeof s === "object" ? s.max_difficulty_reached : undefined;

            return (
              <View key={i} style={styles.skillRow}>
                <View>
                  <Text style={styles.skillName}>{skill}</Text>
                  {attempts !== undefined && (
                    <Text style={styles.skillMeta}>
                      Attempts: {attempts} | Max Diff: {maxDiff}
                    </Text>
                  )}
                </View>
                <Text style={styles.skillScore}>{score}%</Text>
              </View>
            );
          })}
      </View>

      {/* Strengths */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>💪 Strengths</Text>
        {strengths.length > 0 ? (
          strengths.map((s, i) => (
            <Text key={i} style={styles.textItem}>
              • {s}
            </Text>
          ))
        ) : (
          <Text style={styles.textItem}>
            No particular strengths identified.
          </Text>
        )}
      </View>

      {/* Areas for Improvement */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🚀 Areas for Improvement</Text>
        {improvements.length > 0 ? (
          improvements.map((s, i) => (
            <Text key={i} style={styles.textItem}>
              • {s}
            </Text>
          ))
        ) : (
          <Text style={styles.textItem}>
            No improvement areas found. Great job!
          </Text>
        )}
      </View>

      {/* Done Button */}
      <TouchableOpacity
        style={[styles.button, saving && { opacity: 0.7 }]}
        onPress={saveResults}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Done</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ------------------------------------------------------------
// 💅 Styles
// ------------------------------------------------------------
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
  skillMeta: {
    fontSize: 13,
    color: "#6B7280",
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
