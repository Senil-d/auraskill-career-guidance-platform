import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";

const AL_OPTIONS = [
  "Mathematics",
  "Biological Science",
  "Commerce",
  "Arts",
  "Technology",
  "Other/Vocational",
];

const StreamScreen = ({ route }) => {
  const navigation = useNavigation();
  const { signupData } = route.params; // carry signup info

  const [selected, setSelected] = useState(null);

  const handleNext = () => {
    if (!selected) {
      Alert.alert("Select your A/L stream first!");
      return;
    }
    navigation.navigate("Specialization", {
      signupData: { ...signupData, AL_stream: selected },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select your A/L Stream</Text>

      {AL_OPTIONS.map((opt, idx) => (
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

      <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
        <Text style={styles.nextBtnText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
};

export default StreamScreen;

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
