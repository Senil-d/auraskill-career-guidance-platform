import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Button,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import BASE_URL from "../../../config/apiConfig";

const LEskillAssesment = ({ al_stream, career }) => {
  const navigation = useNavigation();
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(1);
  const [total, setTotal] = useState(12); // default, update after start
  const [selectedOption, setSelectedOption] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (al_stream && career) {
      startQuiz();
    }
  }, [al_stream, career]);

  // Start Quiz
  const startQuiz = async () => {
    setLoading(true);
    setResults(null);
    setSelectedOption(null);
    setIndex(1);
    try {
      const res = await axios.post(
        `${BASE_URL}/start`,
        { al_stream, career }
      );
      setSessionId(res.data.session_id);
      setQuestion(res.data.first_question);
      setTotal(res.data.first_question?.total_questions || 12);
    } catch (err) {
      Alert.alert("Error", "Failed to start quiz");
    }
    setLoading(false);
  };

  // Submit Answer
  const submitAnswer = async (selectedIdx) => {
    if (selectedIdx == null) {
      Alert.alert("Select an option");
      return;
    }
    setLoading(true);
    try {
      const weights = question.options[selectedIdx].weights;
      const res = await axios.post(`${BASE_URL}/answer`, {
        session_id: sessionId,
        weights,
      });
      if (res.data.next_question) {
        setQuestion(res.data.next_question);
        setSelectedOption(null);
        setIndex((prev) => prev + 1);
      } else if (res.data.results) {
        setResults(res.data.results);
        setQuestion(null);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to submit answer");
    }
    setLoading(false);
  };

  // Loading State
  if (loading || (!question && !results)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading...</Text>
      </View>
    );
  }

  // Results
  if (results) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>🏁 Leadership Assessment Complete!</Text>
        <Text style={styles.progress}>Your Results:</Text>
        <View style={styles.resultBox}>
          <Text>Decision Making: {results.decision_making}/10</Text>
          <Text>Empathy: {results.empathy}/10</Text>
          <Text>Conflict Management: {results.conflict_management}/10</Text>
          <Text>Strategic Thinking: {results.strategic_thinking}/10</Text>
          <Text>Overall Score: {results.overall_score}/10</Text>
          <Text>Level: {results.leadership_level}</Text>
          <Text>Feedback: {results.feedback}</Text>
        </View>
        <Button title="Restart" onPress={startQuiz} />
      </View>
    );
  }

  // Render Question + Options
  return (
    <View style={styles.container}>
      <Text style={styles.header}>🧑‍💼 Leadership Assessment</Text>
      <Text style={styles.progress}>
        Question {index} / {total}
      </Text>
      <View style={styles.questionBox}>
        <Text style={styles.question}>{question.scenario}</Text>
      </View>
      {question.options &&
        question.options.map((opt, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.option,
              selectedOption === i && styles.selectedOption,
            ]}
            onPress={() => {
              setSelectedOption(i);
              submitAnswer(i);
            }}
            disabled={loading}
          >
            <Text style={styles.optionText}>{opt.text}</Text>
          </TouchableOpacity>
        ))}
    </View>
  );
};

export default LEskillAssesment;

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
  selectedOption: {
    backgroundColor: "#cce5ff",
    borderColor: "#3399ff",
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
  resultBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
});