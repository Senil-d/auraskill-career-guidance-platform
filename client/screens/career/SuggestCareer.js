import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Animatable from "react-native-animatable";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import LottieView from "lottie-react-native";
import { useNavigation } from "@react-navigation/native";
import BASE_URL from "../../config/apiConfig";

const SuggestCareer = () => {
  const [step, setStep] = useState(1);
  const [ALStream, setALStream] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [careerSuggestions, setCareerSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();

  // A/L streams list
  const STREAMS = [
    "Mathematics",
    "Biological Science",
    "Commerce",
    "Arts",
    "Technology",
    "Other / Vocational",
  ];

  // Specialization list
  const SPECIALIZATIONS = [
    "Software Engineering",
    "Information Technology",
    "Computer Systems & Network Engineering",
    "Information Systems Engineering",
    "Cyber Security",
    "Interactive Media",
    "Data Science",
    "Bioinformatics",
    "Robotics",
  ];

  // 🔹 Step 1: Select stream
  const handleStreamSelect = (stream) => {
    setALStream(stream);
    setStep(2);
  };

  // 🔹 Step 2: Select specialization
  const handleSpecializationSelect = (spec) => {
    setSpecialization(spec);
    fetchCareerSuggestions(ALStream, spec);
  };

  // 🔹 Fetch career suggestions from backend
  const fetchCareerSuggestions = async (stream, spec) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Authentication Error", "Please log in again.");
        return;
      }

      const res = await axios.post(
        `${BASE_URL}/api/career/suggest`,
        { AL_stream: stream, specialization: spec },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.suggestions?.length > 0) {
        setCareerSuggestions(res.data.suggestions);
        setStep(3);
      } else {
        Alert.alert("No matches found", "Try different selections.");
      }
    } catch (error) {
      console.error("Career Suggestion Error:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to fetch career suggestions."
      );
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Handle user selecting a career (Navigate to Skill Chart)
  const handleCareerSelect = (career) => {
    navigation.navigate("CareerSkillChart", { chosenCareer: career });
  };

  return (
    <LinearGradient
      colors={["#6A5AE0", "#836FFF"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Animatable.View animation="fadeInUp" duration={800} style={styles.card}>
          {/* 🟣 STEP 1 - Choose A/L Stream */}
          {step === 1 && (
            <>
              <Text style={styles.header}>🎓 Choose Your A/L Stream</Text>
              <Text style={styles.subText}>Select your Advanced Level stream.</Text>

              {STREAMS.map((stream, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionBox,
                    ALStream === stream && styles.selectedOption,
                  ]}
                  onPress={() => handleStreamSelect(stream)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      ALStream === stream && styles.selectedOptionText,
                    ]}
                  >
                    {stream}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* 🟢 STEP 2 - Choose Specialization */}
          {step === 2 && (
            <>
              <Text style={styles.header}>💡 Choose Your Specialization</Text>
              <Text style={styles.subText}>
                You selected <Text style={{ fontWeight: "bold" }}>{ALStream}</Text>.
              </Text>

              {SPECIALIZATIONS.map((spec, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionBox,
                    specialization === spec && styles.selectedOption,
                  ]}
                  onPress={() => handleSpecializationSelect(spec)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      specialization === spec && styles.selectedOptionText,
                    ]}
                  >
                    {spec}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                <Text style={styles.backButtonText}>← Back to Streams</Text>
              </TouchableOpacity>
            </>
          )}

          {/* 🔵 STEP 3 - Display Suggested Careers */}
          {step === 3 && (
            <>
              <Text style={styles.header}>💼 Suggested Careers</Text>
              <Text style={styles.subText}>
                Based on your choices in{" "}
                <Text style={{ fontWeight: "bold" }}>{ALStream}</Text> →{" "}
                <Text style={{ fontWeight: "bold" }}>{specialization}</Text>
              </Text>

              {loading ? (
                <ActivityIndicator color="#6A5AE0" size="large" />
              ) : (
                careerSuggestions.map((sug, i) => (
                  <Animatable.View
                    key={i}
                    animation="fadeInUp"
                    delay={i * 100}
                    style={styles.suggestionBox}
                  >
                    <LottieView
                      source={require("../../assets/student.json")}
                      autoPlay
                      loop
                      style={styles.lottie}
                    />
                    {sug.careers.map((career, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.careerOption}
                        onPress={() => handleCareerSelect(career)}
                      >
                        <Text style={styles.careerText}>{career}</Text>
                      </TouchableOpacity>
                    ))}
                    <Text style={styles.justificationText}>{sug.justification}</Text>
                  </Animatable.View>
                ))
              )}

              <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
                <Text style={styles.backButtonText}>← Change Specialization</Text>
              </TouchableOpacity>
            </>
          )}
        </Animatable.View>
      </ScrollView>
    </LinearGradient>
  );
};

export default SuggestCareer;

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
    width: "100%",
    maxWidth: 380,
    padding: 25,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
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
    marginVertical: 10,
  },
  optionBox: {
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginVertical: 6,
  },
  optionText: { fontSize: 16, color: "#333", textAlign: "center" },
  selectedOption: { backgroundColor: "#6A5AE0", borderColor: "#6A5AE0" },
  selectedOptionText: { color: "#fff", fontWeight: "bold" },
  suggestionBox: {
    backgroundColor: "#F7F5FF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  lottie: { width: 100, height: 100, alignSelf: "center" },
  careerOption: {
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    marginVertical: 4,
    backgroundColor: "#fff",
  },
  careerText: { color: "#333", fontSize: 15, textAlign: "center" },
  justificationText: {
    fontStyle: "italic",
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  backButton: { alignItems: "center", marginTop: 15 },
  backButtonText: { color: "#6A5AE0", fontWeight: "600" },
});
