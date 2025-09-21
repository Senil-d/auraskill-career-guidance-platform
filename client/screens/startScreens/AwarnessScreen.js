import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";

const AwarenessScreen = ({ route }) => {
  const navigation = useNavigation();
  const { signupData } = route.params; // carry signup data forward

  const handleNext = () => {
    navigation.replace("Stream", { signupData });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Why We Ask These Questions 🤔</Text>
        <Text style={styles.text}>
          To suggest the most suitable **career paths** for you, we need to know:
        </Text>

        <View style={styles.pointBox}>
          <Text style={styles.pointTitle}>📌 Your A/L Stream</Text>
          <Text style={styles.pointDesc}>
            This helps us understand your educational foundation and strengths.
          </Text>
        </View>

        <View style={styles.pointBox}>
          <Text style={styles.pointTitle}>📌 Your Preferred IT Specialization</Text>
          <Text style={styles.pointDesc}>
            This lets us align our career suggestions with your future goals.
          </Text>
        </View>

        <Text style={styles.note}>
          🔑 Together, these answers help us recommend the **best-fit IT careers**
          tailored for you.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default AwarenessScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#000",
  },
  card: {
    backgroundColor: "#000",
    padding: 25,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#E1C16E",
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E1C16E",
    marginBottom: 15,
    textAlign: "center",
  },
  text: {
    color: "#eee",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  pointBox: {
    borderWidth: 1,
    borderColor: "#E1C16E",
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
  pointTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E1C16E",
    marginBottom: 5,
  },
  pointDesc: {
    fontSize: 15,
    color: "#eee",
  },
  note: {
    fontSize: 15,
    color: "#eee",
    marginVertical: 20,
    textAlign: "center",
    fontStyle: "italic",
  },
  button: {
    backgroundColor: "#000",
    borderColor: "#E1C16E",
    borderWidth: 2,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 40,
    alignSelf: "center",
    marginTop: 15,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E1C16E",
  },
});
