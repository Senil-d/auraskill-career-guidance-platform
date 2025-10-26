import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BASE_URL from "../../../config/apiConfig";

export default function AnalyticalQuizScreen() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [userId, setUserId] = useState("");
  
  const navigation = useNavigation();

  // 🧠 Initialize Quiz
  useEffect(() => {
    const initQuiz = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userData = JSON.parse(await AsyncStorage.getItem("user"));

        if (!userData) {
          Alert.alert("Error", "No user data found. Please log in again.");
          return;
        }

        setUserId(userData._id);
        setCareer(userData.career || "");
        setALStream(userData.AL_stream || "");

        // ✅ Validate before API call
        if (!userData.career || !userData.AL_stream) {
          Alert.alert(
            "Missing Career Info",
            "Please choose your A/L stream and career before starting the quiz."
          );
          setLoading(false);
          return;
        }

        // 🚀 Start quiz with real data
        const res = await axios.post(`${BASE_URL}/api/analytical/start`, {
          user_id: userData._id,
          career: userData.career,
          AL_stream: userData.AL_stream,
        });

        // ✅ Use backend response safely
        const firstQuestion = res.data.first_question;
        const remaining = res.data.remainingQuestions || [];
        setQuestions([firstQuestion, ...remaining]);
        setLoading(false);
      } catch (error) {
        console.error("Quiz start error:", error.response?.data || error.message);
        Alert.alert("Error", "Could not start quiz. Try again later.");
        setLoading(false);
      }
    };

    initQuiz();
  }, []);

  // 🧩 Submit Answer
  const handleSubmit = async () => {
    if (!selected) {
      Alert.alert("Select an answer before continuing!");
      return;
    }
    const q = questions[currentIndex];

    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/api/analytical/submit`, {
        user_id: userId,
        question_id: q.id,
        selected_answer: selected,
        correct_answer: q.correct,
        category: q.category,
      });
      setLoading(false);

      if (res.data.status === "next") {
        setCurrentIndex(currentIndex + 1);
        setSelected(null);
        setQuestions([...questions, res.data.next_question]);
      } else if (res.data.status === "completed") {
        setResult(res.data.evaluation);
        navigation.replace("AnalyticalResultScreen", {
          evaluation: res.data.evaluation,
        });
      }
    } catch (error) {
      console.error("Submit error:", error.response?.data || error.message);
      setLoading(false);
    }
  };

  // ⏳ Show loading state while generating questions
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>
          Generating your personalized analytical quiz...
        </Text>
      </View>
    );
  }

  const q = questions[currentIndex];

  return (
    <LinearGradient colors={["#0f172a", "#1e293b"]} style={styles.container}>
      <Text style={styles.title}>Question {currentIndex + 1}</Text>
      <Text style={styles.question}>{q?.question || "..."}</Text>

      {q?.options?.map((opt, idx) => (
        <TouchableOpacity
          key={idx}
          style={[
            styles.option,
            selected === opt && { backgroundColor: "#38bdf8" },
          ]}
          onPress={() => setSelected(opt)}
        >
          <Text style={styles.optionText}>{opt}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>
          {currentIndex + 1 === 12 ? "Finish & Submit" : "Next"}
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 10 },
  question: { color: "#fff", fontSize: 18, marginBottom: 20 },
  option: {
    backgroundColor: "#334155",
    padding: 15,
    borderRadius: 12,
    marginVertical: 6,
  },
  optionText: { color: "#f1f5f9", fontSize: 16 },
  button: {
    backgroundColor: "#0ea5e9",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    marginTop: 15,
    color: "#cbd5e1",
    fontSize: 15,
    textAlign: "center",
  },
});
