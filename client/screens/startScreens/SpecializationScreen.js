import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import BASE_URL from "../../config/apiConfig";

const SPECIALIZATIONS = [
  "Information Technology",
  "Computer Systems & Network Eng.",
  "Software Engineering",
  "Information Systems Engineering",
  "Cyber Security",
  "Interactive Media",
  "Data Science",
];

const SpecializationScreen = ({ route }) => {
  const navigation = useNavigation();
  const { signupData } = route.params; // comes with username, email, password, AL_stream

  const [selected, setSelected] = useState(null);

  const handleSubmit = async () => {
    if (!selected) {
      Alert.alert("Select your preferred IT specialization!");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.replace("Login");
        return;
      }

      // Send all data to backend in ONE request
      const response = await axios.put(
      `${BASE_URL}/api/auth/update-profile`,
      {
        AL_stream: signupData.AL_stream, 
        specialization: selected
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

      if (response.data) {
        Alert.alert("Success", "Profile updated successfully!");
        navigation.replace("Home");
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Something went wrong"
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose your IT Specialization</Text>

      {SPECIALIZATIONS.map((opt, idx) => (
        <TouchableOpacity
          key={idx}
          style={[
            styles.option,
            selected === opt && styles.selectedOption,
          ]}
          onPress={() => setSelected(opt)}
        >
          <Text
            style={[
              styles.optionText,
              selected === opt && styles.selectedOptionText,
            ]}
          >
            {opt}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.nextBtn} onPress={handleSubmit}>
        <Text style={styles.nextBtnText}>Finish</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SpecializationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    color: "#E1C16E",
    fontWeight: "bold",
    marginBottom: 20,
  },
  option: {
    borderWidth: 2,
    borderColor: "#E1C16E",
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    width: "100%",
    alignItems: "center",
  },
  optionText: {
    color: "#fff",
    fontSize: 16,
  },
  selectedOption: {
    backgroundColor: "#E1C16E",
  },
  selectedOptionText: {
    color: "#000",
    fontWeight: "bold",
  },
  nextBtn: {
    marginTop: 25,
    backgroundColor: "#000",
    borderColor: "#E1C16E",
    borderWidth: 2,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  nextBtnText: {
    color: "#E1C16E",
    fontSize: 18,
    fontWeight: "bold",
  },
});
