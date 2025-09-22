import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Progress from "react-native-progress";
import { useNavigation, useRoute } from "@react-navigation/native";
import BASE_URL from "../../config/apiConfig";

const { width } = Dimensions.get("window");

const LeadershipResultScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { sessionToken } = route.params || {};

  const [summary, setSummary] = useState(null);
  const [career, setCareer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load summary + user career
  useEffect(() => {
    const fetchData = async () => {
      try {
        const jwt = await AsyncStorage.getItem("token");
        if (!jwt) {
          navigation.replace("Login");
          return;
        }

        // Fetch summary
        const resSummary = await axios.get(
          `${BASE_URL}/api/leadership/summary/${sessionToken}`,
          { headers: { Authorization: `Bearer ${jwt}` } }
        );
        setSummary(resSummary.data);

        // Fetch user profile for career
        const resUser = await axios.get(`${BASE_URL}/api/auth/get-user`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        setCareer(resUser.data.career || "Not Chosen");
      } catch (err) {
        console.error("Error loading results:", err.message);
        Alert.alert("Error", "Could not load leadership results");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionToken]);

  if (loading || !summary) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E1C16E" />
        <Text style={{ color: "#E1C16E", marginTop: 10 }}>Loading results...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🎯 Leadership Assessment Result</Text>

      {/* Career Info */}
      <View style={styles.card}>
        <Text style={styles.label}>💼 Career Chosen:</Text>
        <Text style={styles.value}>{career}</Text>
      </View>

      {/* Overall Score */}
      <View style={styles.card}>
        <Text style={styles.label}>⭐ Overall Leadership Score</Text>
        <Text style={styles.score}>
          {summary.overall_score} / 10 ({summary.level})
        </Text>
        <Progress.Bar
          progress={summary.overall_score / 10}
          width={width - 80}
          height={14}
          color="#E1C16E"
          borderRadius={7}
          unfilledColor="#333"
          style={{ marginTop: 10 }}
        />
      </View>

      {/* Trait Scores */}
      <View style={styles.card}>
        <Text style={styles.label}>📊 Trait Breakdown</Text>
        {Object.entries(summary.trait_scores).map(([trait, data]) => (
          <View key={trait} style={{ marginTop: 12 }}>
            <Text style={styles.traitLabel}>
              {trait} ({data.score}/10) - {data.level}
            </Text>
            <Progress.Bar
              progress={data.score / 10}
              width={width - 100}
              height={12}
              color="#4CAF50"
              borderRadius={6}
              unfilledColor="#333"
            />
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.replace("Home")}
        >
          <Text style={styles.buttonText}>🏠 Go to Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.replace("LeadershipQuiz")}
        >
          <Text style={styles.buttonText}>🔄 Retry Quiz</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default LeadershipResultScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#000",
    padding: 20,
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E1C16E",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#111",
    borderColor: "#E1C16E",
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    width: "100%",
  },
  label: {
    fontSize: 16,
    color: "#E1C16E",
    marginBottom: 6,
    fontWeight: "600",
  },
  value: {
    fontSize: 16,
    color: "#eee",
    marginBottom: 10,
  },
  score: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 5,
  },
  traitLabel: {
    color: "#E1C16E",
    fontSize: 14,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
  },
  homeButton: {
    backgroundColor: "#E1C16E",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 5,
  },
  retryButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 5,
  },
  buttonText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "bold",
  },
});
