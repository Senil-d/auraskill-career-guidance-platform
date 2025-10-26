import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AnalyticalResultScreen() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const result = params?.evaluation;

  return (
    <LinearGradient colors={["#1e293b", "#0f172a"]} style={styles.container}>
      <Text style={styles.title}>🎯 Analytical Skill Summary</Text>
      <Text style={styles.score}>Score: {result?.overall_score}%</Text>
      <Text style={styles.level}>Level: {result?.level}</Text>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Feedback:</Text>
        <Text style={styles.text}>{result?.feedback}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Home")}>
        <Text style={styles.buttonText}>Back to Home</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 22, color: "#fff", fontWeight: "700", marginBottom: 20 },
  score: { fontSize: 20, color: "#38bdf8", fontWeight: "700" },
  level: { fontSize: 18, color: "#facc15", marginBottom: 15 },
  section: { marginVertical: 10 },
  subtitle: { fontSize: 16, color: "#fff", fontWeight: "600" },
  text: { color: "#cbd5e1", fontSize: 15, marginTop: 5, textAlign: "center" },
  button: {
    backgroundColor: "#0ea5e9",
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
    width: "60%",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
