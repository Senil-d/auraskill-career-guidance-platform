// ------------------------------------------------------------
// ResultScreen.js
// ------------------------------------------------------------
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function ResultScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { summary } = route.params || {};

  if (!summary) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>No results available 😕</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.replace("ProblemSolvingQuizScreen")}>
          <Text style={styles.buttonText}>Retry Quiz</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { overall_score, total_questions, subskill_summary, strengths, improvements } = summary;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>🎉 Quiz Completed!</Text>

      <View style={styles.card}>
        <Text style={styles.scoreLabel}>Overall Score</Text>
        <Text style={styles.scoreValue}>{overall_score}%</Text>
        <Text style={styles.subText}>Total Questions: {total_questions}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📊 Sub-Skill Performance</Text>
        {Object.keys(subskill_summary).map((skill, i) => {
          const s = subskill_summary[skill];
          return (
            <View key={i} style={styles.skillRow}>
              <Text style={styles.skillName}>{skill}</Text>
              <Text style={styles.skillScore}>{s.score}%</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>💪 Strengths</Text>
        {strengths.length > 0 ? (
          strengths.map((s, i) => <Text key={i} style={styles.textItem}>• {s}</Text>)
        ) : (
          <Text style={styles.textItem}>No particular strengths identified.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🚀 Areas for Improvement</Text>
        {improvements.length > 0 ? (
          improvements.map((s, i) => <Text key={i} style={styles.textItem}>• {s}</Text>)
        ) : (
          <Text style={styles.textItem}>No improvement areas found. Great job!</Text>
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.replace("ReadyScreen")}>
        <Text style={styles.buttonText}>Go to Dashboard</Text>
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
