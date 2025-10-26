import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from "../../../config/apiConfig";
import { useNavigation } from "@react-navigation/native";

export default function ProblemSolvingQuizScreen() {
  const navigation = useNavigation();
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    startQuiz();
  }, []);
  
  const startQuiz = async () => {
    try {
      setLoading(true);

      // ✅ Retrieve token from AsyncStorage
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Please log in again to start the quiz.");
        return;
      }

      console.log("🔑 Using token:", token.substring(0, 20) + "...");

      // ✅ Authenticated request
      const res = await axios.post(
        `${BASE_URL}/api/problemsolving/start`,
        {}, // No body needed — backend gets user info from token
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Quiz started:", res.data);

      setSessionId(res.data.session_id);
      setQuestion(res.data.current_question);
      setTotal(res.data.total_questions);
      setIndex(1);
    } catch (error) {
      console.error(
        "Start quiz error:",
        error.response?.data || error.message
      );
      Alert.alert(
        "Error",
        error.response?.data?.error || "Unable to start quiz"
      );
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // 🧩 Submit Answer (auto next question or complete)
  // ------------------------------------------------------------
  const submitAnswer = async (selected) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      const payload = {
        session_id: sessionId,
        id: question.id,
        selected,
        correct: question.correct || question.answer, // depends on backend field
        sub_skill: question.sub_skill,
        difficulty: question.difficulty,
      };

      const res = await axios.post(
        `${BASE_URL}/api/problemsolving/submit`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data.status === "in_progress") {
        console.log("✅ Next question:", res.data.next_question.id);
        setQuestion(res.data.next_question);
        setIndex((prev) => prev + 1);
      } else if (res.data.status === "completed") {
        console.log("🏁 Quiz Completed:", res.data.summary);
        Alert.alert("Quiz Completed!", "Redirecting to result screen...");
        navigation.replace("ResultScreen", { summary: res.data.summary });
      }
    } catch (error) {
      console.error(
        "Submit error:",
        error.response?.data || error.message
      );
      Alert.alert("Error", "Failed to submit answer");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // ⏳ Loading State
  // ------------------------------------------------------------
  if (loading || !question) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading...</Text>
      </View>
    );
  }

  // ------------------------------------------------------------
  // 🧠 Render Question + Options
  // ------------------------------------------------------------
  return (
    <View style={styles.container}>
      <Text style={styles.header}>🧠 Problem-Solving Quiz</Text>
      <Text style={styles.progress}>
        Question {index} / {total}
      </Text>

      <View style={styles.questionBox}>
        <Text style={styles.question}>{question.problem || question.question}</Text>
      </View>

      {question.options &&
        question.options.map((opt, i) => (
          <TouchableOpacity
            key={i}
            style={styles.option}
            onPress={() => submitAnswer(opt)}
          >
            <Text style={styles.optionText}>{opt}</Text>
          </TouchableOpacity>
        ))}
    </View>
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
    paddingTop: 60,
  },
  header: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111827",
  },
  progress: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
  },
  questionBox: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  question: {
    fontSize: 17,
    color: "#111827",
    fontWeight: "500",
  },
  option: {
    backgroundColor: "#E5E7EB",
    padding: 14,
    borderRadius: 8,
    marginVertical: 6,
  },
  optionText: {
    fontSize: 16,
    color: "#111827",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
