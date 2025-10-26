import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Animatable from "react-native-animatable";
import { getUserProfile } from "../../services/userServices";

const ProfileScreen = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getUserProfile();
        setUser(data);
      } catch (error) {
        alert("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#6A5AE0" size="large" />
        <Text style={{ color: "#555", marginTop: 10 }}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: "#fff" }}>No user data found.</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#6A5AE0", "#836FFF"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Animatable.View animation="fadeInUp" duration={800} style={styles.card}>
          <Text style={styles.title}>👤 {user.username}</Text>
          <Text style={styles.subtitle}>{user.email}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>🎓 Academic Info</Text>
          <Text style={styles.item}>A/L Stream: {user.AL_stream || "Not set"}</Text>
          <Text style={styles.item}>Specialization: {user.specialization || "Not set"}</Text>
          <Text style={styles.item}>Career Goal: {user.career || "Not set"}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>💼 Skill Profile</Text>
          {user.results && Object.entries(user.results).length > 0 ? (
            Object.entries(user.results).map(([key, result], index) => (
              <View key={index} style={styles.resultCard}>
                <Text style={styles.resultTitle}>{key}</Text>
                <Text style={styles.resultText}>
                  Score: {result.overall_score ?? 0}%
                </Text>
                <Text style={styles.resultText}>Level: {result.level || "N/A"}</Text>
                <Text style={styles.resultText}>
                  Feedback: {result.feedback || "No feedback yet"}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.item}>No results found</Text>
          )}

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>🧠 Decision Style</Text>
          <Text style={styles.item}>
            {user.decisionStyle || "Not yet assessed"}
          </Text>

          <Text style={styles.sectionTitle}>📝 Skill Justification</Text>
          <Text style={styles.item}>
            {user.skillJustification || "No justification available"}
          </Text>
        </Animatable.View>
      </ScrollView>
    </LinearGradient>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#6A5AE0",
  },
  subtitle: {
    color: "#555",
    fontSize: 14,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
    color: "#6A5AE0",
  },
  item: {
    fontSize: 15,
    color: "#333",
    marginTop: 5,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 10,
  },
  resultCard: {
    backgroundColor: "#F9F8FF",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  resultTitle: {
    fontWeight: "bold",
    color: "#6A5AE0",
  },
  resultText: {
    color: "#333",
  },
});
