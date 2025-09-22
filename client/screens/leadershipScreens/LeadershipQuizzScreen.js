import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import * as Progress from "react-native-progress";
import BASE_URL from "../../config/apiConfig";

const { width } = Dimensions.get("window");
const TOTAL_TRAITS = 6;
const QUESTIONS_PER_TRAIT = 3;
const TOTAL_QUESTIONS = TOTAL_TRAITS * QUESTIONS_PER_TRAIT;

const LeadershipQuizScreen = () => {
  const navigation = useNavigation();
  const [sessionToken, setSessionToken] = useState(null);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quitModalVisible, setQuitModalVisible] = useState(false);

  // Progress
  const [traitProgress, setTraitProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [traitQuestionIndex, setTraitQuestionIndex] = useState(0);

  // Timer
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  // Answer state
  const [selectedIndex, setSelectedIndex] = useState(null);

  // Start session
  useEffect(() => {
    const startSession = async () => {
      try {
        const jwt = await AsyncStorage.getItem("token");
        if (!jwt) {
          navigation.replace("Login");
          return;
        }

        const response = await axios.post(
          `${BASE_URL}/api/leadership/start`,
          {},
          { headers: { Authorization: `Bearer ${jwt}` } }
        );

        if (response.data.session_token) {
          const newSession = response.data.session_token;
          setSessionToken(newSession);
          await AsyncStorage.setItem("session_token", newSession);

          if (response.data.first_question) {
            loadQuestion(response.data.first_question, 1, 1);
          }
        }
      } catch (err) {
        console.error("Error starting session:", err.message);
        Alert.alert("Error", "Could not start leadership quiz");
        navigation.replace("Home");
      } finally {
        setLoading(false);
      }
    };

    startSession();
  }, []);

  // Timer effect
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit(); // auto-submit when time runs out
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft]);

  // Load question
  const loadQuestion = (q, traitIndex, overallIndex) => {
    setQuestion({
      id: q.id,
      type: q.type,
      trait: q.trait,
      difficulty: q.difficulty,
      text: q.question,
      options: q.options,
    });

    setSelectedIndex(null);

    if (q.type === "timed") {
      setTimeLeft(q.time_limit || 30);
    } else {
      setTimeLeft(null);
    }

    setCurrentQuestionIndex(overallIndex);
    setTraitQuestionIndex(traitIndex);

    setOverallProgress(overallIndex / TOTAL_QUESTIONS);
    setTraitProgress(traitIndex / QUESTIONS_PER_TRAIT);
  };

  // Submit answer
  const handleSubmit = async () => {
    try {
      const jwt = await AsyncStorage.getItem("token");
      const sessionToken = await AsyncStorage.getItem("session_token");

      const payload = {
        session_token: sessionToken,
        question_id: question.id,
        selected_index: selectedIndex, // null = wrong
      };

      console.log("Submitting payload:", JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${BASE_URL}/api/leadership/submit`,
        payload,
        { headers: { Authorization: `Bearer ${jwt}` } }
      );

      if (response.data?.id) {
        const next = response.data;
        let newOverall = currentQuestionIndex + 1;
        let newTrait = traitQuestionIndex + 1;
        if (newTrait > QUESTIONS_PER_TRAIT) newTrait = 1;
        loadQuestion(next, newTrait, newOverall);
      } else if (response.data?.completed) {
        navigation.replace("LeadershipResult", { sessionToken });
      }
    } catch (err) {
      console.error("Error submitting answer:", err.message);
      Alert.alert("Error", "Could not submit answer");
    }
  };

  // Render options
  const renderOptions = () =>
    question.options.map((opt, idx) => (
      <TouchableOpacity
        key={idx}
        style={[
          styles.optionButton,
          selectedIndex === idx && { backgroundColor: "#333" },
        ]}
        onPress={() => setSelectedIndex(idx)}
      >
        <Text style={styles.optionText}>{opt}</Text>
      </TouchableOpacity>
    ));

  if (loading || !question) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E1C16E" />
        <Text style={{ color: "#E1C16E", marginTop: 10 }}>Loading question...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Trait + Progress */}
      <Text style={styles.traitLabel}>Trait: {question.trait}</Text>

      <View style={styles.progressRow}>
        <Progress.Bar
          progress={traitProgress}
          width={width - 100}
          height={12}
          borderRadius={6}
          color="#E1C16E"
          unfilledColor="#333"
        />
        <Text style={styles.progressText}>
          {traitQuestionIndex}/{QUESTIONS_PER_TRAIT}
        </Text>
      </View>

      <View style={styles.progressRow}>
        <Progress.Bar
          progress={overallProgress}
          width={width - 100}
          height={12}
          borderRadius={6}
          color="#4CAF50"
          unfilledColor="#333"
        />
        <Text style={styles.progressText}>
          {currentQuestionIndex}/{TOTAL_QUESTIONS}
        </Text>
      </View>

      {/* Type badge + tip */}
      <View style={styles.typeBadge}>
        <Text style={styles.typeText}>
          {question.type === "msq" && "📝 Multiple Choice"}
          {question.type === "timed" && "⏳ Timed Question"}
          {question.type === "roleplay" && "🎭 Roleplay Scenario"}
        </Text>
      </View>
      <Text style={styles.tipText}>
        {question.type === "msq" && "Tip: Choose the best option."}
        {question.type === "timed" && "Tip: Answer before time runs out."}
        {question.type === "roleplay" && "Tip: Pick the most professional response."}
      </Text>

      {/* Timer */}
      {question.type === "timed" && (
        <Text style={styles.timer}>⏳ Time Left: {timeLeft}s</Text>
      )}

      {/* Question */}
      <Text style={styles.question}>{question.text}</Text>

      {/* Options */}
      {renderOptions()}

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>✅ Submit Answer</Text>
      </TouchableOpacity>

      {/* Quit */}
      <TouchableOpacity
        style={styles.quitButton}
        onPress={() => setQuitModalVisible(true)}
      >
        <Text style={styles.quitText}>Quit Quiz</Text>
      </TouchableOpacity>

      {/* Quit Modal */}
      <Modal visible={quitModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalText}>Are you sure you want to quit?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => navigation.replace("Home")}
              >
                <Text style={styles.optionText}>Yes, Quit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setQuitModalVisible(false)}
              >
                <Text style={styles.optionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default LeadershipQuizScreen;

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#000", padding: 20 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  question: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  traitLabel: {
    fontSize: 16,
    color: "#E1C16E",
    marginBottom: 6,
    textAlign: "center",
  },
  timer: { fontSize: 16, color: "#ffcc00", marginBottom: 10, textAlign: "center" },
  optionButton: {
    backgroundColor: "#111",
    borderColor: "#E1C16E",
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  optionText: { color: "#E1C16E", fontSize: 16, textAlign: "center" },
  submitButton: {
    backgroundColor: "#E1C16E",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  quitButton: { marginTop: 20, alignSelf: "center" },
  quitText: { color: "#ff4d4d", fontSize: 16, textDecorationLine: "underline" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#111",
    borderColor: "#E1C16E",
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    width: "80%",
  },
  modalText: { color: "#eee", fontSize: 16, marginBottom: 20, textAlign: "center" },
  modalActions: { flexDirection: "row", justifyContent: "space-around" },
  modalButton: {
    backgroundColor: "#000",
    borderColor: "#E1C16E",
    borderWidth: 2,
    borderRadius: 12,
    padding: 10,
    minWidth: 100,
    alignItems: "center",
  },
  typeBadge: {
    backgroundColor: "#222",
    borderColor: "#E1C16E",
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "center",
    marginBottom: 8,
  },
  typeText: { color: "#E1C16E", fontSize: 14, fontWeight: "600" },
  tipText: {
    color: "#aaa",
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 12,
    textAlign: "center",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    justifyContent: "center",
  },
  progressText: {
    color: "#E1C16E",
    fontSize: 14,
    marginLeft: 10,
    width: 40,
    textAlign: "center",
  },
});
