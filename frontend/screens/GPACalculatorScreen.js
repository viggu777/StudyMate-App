import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// --- Theme Colors (consistent with App.js) ---
const theme = {
  primary: "#2563eb",
  primaryLight: "#3b82f6",
  secondary: "#059669",
  lightGray: "#f3f4f6",
  mediumGray: "#6b7280",
  darkGray: "#1f2937",
  white: "#ffffff",
  danger: "#ef4444",
  backgroundGradientEnd: "#f0f5ff", // Added for gradient
};

export default function GPACalculatorScreen() {
  const [subjects, setSubjects] = useState([
    { id: 1, name: "", credits: "", grade: "" },
    { id: 2, name: "", credits: "", grade: "" },
    { id: 3, name: "", credits: "", grade: "" },
  ]);
  const [gpa, setGpa] = useState(null);

  const handleSubjectChange = (id, field, value) => {
    if (field === "credits" || field === "grade") {
      if (value && !/^\d*\.?\d*$/.test(value)) return;
    }
    const newSubjects = subjects.map((subject) =>
      subject.id === id ? { ...subject, [field]: value } : subject
    );
    setSubjects(newSubjects);
    setGpa(null);
  };

  const addSubjectRow = () => {
    setSubjects([
      ...subjects,
      { id: Date.now(), name: "", credits: "", grade: "" },
    ]);
  };

  const removeSubjectRow = (id) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter((subject) => subject.id !== id));
      setGpa(null);
    } else {
      Alert.alert("Cannot Remove", "At least one subject row is required.");
    }
  };

  const calculateGpa = () => {
    let totalCreditPoints = 0;
    let totalCredits = 0;

    for (const subject of subjects) {
      const credits = parseFloat(subject.credits);
      const grade = parseFloat(subject.grade);

      if (isNaN(credits) || isNaN(grade) || credits <= 0 || grade < 0) {
        Alert.alert(
          "Invalid Input",
          "Please enter valid numbers for all credits and grade points. Credits must be greater than 0."
        );
        setGpa(null);
        return;
      }
      totalCreditPoints += credits * grade;
      totalCredits += credits;
    }
    if (totalCredits === 0) {
      Alert.alert(
        "No Credits",
        "Please enter credits for at least one subject."
      );
      setGpa(null);
      return;
    }
    const calculatedGpa = totalCreditPoints / totalCredits;
    setGpa(calculatedGpa.toFixed(2));
  };

  return (
    <LinearGradient
      colors={[theme.primary, theme.backgroundGradientEnd]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent={true}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <Text style={styles.title}>GPA Calculator</Text>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.contentContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.headerText, { flex: 2 }]}>
                  Subject Name
                </Text>
                <Text style={styles.headerText}>Credits</Text>
                <Text style={styles.headerText}>Grade</Text>
                <View style={styles.removeHeaderPlaceholder} />
              </View>

              {subjects.map((subject) => (
                <View key={subject.id} style={styles.row}>
                  <TextInput
                    style={[styles.input, { flex: 2 }]}
                    placeholder="e.g., Maths"
                    value={subject.name}
                    onChangeText={(text) =>
                      handleSubjectChange(subject.id, "name", text)
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 4"
                    keyboardType="numeric"
                    value={subject.credits}
                    onChangeText={(text) =>
                      handleSubjectChange(subject.id, "credits", text)
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 9"
                    keyboardType="numeric"
                    value={subject.grade}
                    onChangeText={(text) =>
                      handleSubjectChange(subject.id, "grade", text)
                    }
                  />
                  <TouchableOpacity
                    onPress={() => removeSubjectRow(subject.id)}
                    style={styles.removeButton}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={theme.danger}
                    />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                onPress={addSubjectRow}
                style={styles.addButton}
              >
                <Ionicons name="add" size={20} color={theme.primary} />
                <Text style={styles.addButtonText}>Add Subject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={calculateGpa}
                style={styles.calculateButton}
              >
                <Text style={styles.calculateButtonText}>Calculate GPA</Text>
              </TouchableOpacity>

              {gpa !== null && (
                <View style={styles.resultContainer}>
                  <Text style={styles.resultLabel}>Your Semester GPA is</Text>
                  <Text style={styles.resultText}>{gpa}</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    backgroundColor: "transparent",
    paddingVertical: 15,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.white,
    textAlign: "center",
  },
  scrollContainer: { paddingBottom: 50 },
  contentContainer: {
    padding: 20,
  },
  tableHeader: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  headerText: {
    flex: 1,
    fontWeight: "bold",
    color: theme.darkGray,
    fontSize: 14,
    textAlign: "center",
  },
  removeHeaderPlaceholder: { width: 40, marginLeft: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginRight: 10,
    fontSize: 16,
    textAlign: "center",
    color: theme.darkGray,
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    flexDirection: "row",
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: theme.primary,
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  calculateButton: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.secondary,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  calculateButtonText: {
    color: theme.white,
    fontWeight: "bold",
    fontSize: 18,
  },
  resultContainer: {
    marginTop: 24,
    padding: 24,
    backgroundColor: theme.primary,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  resultLabel: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.8)",
  },
  resultText: {
    fontSize: 52,
    fontWeight: "bold",
    color: theme.white,
    marginTop: 4,
  },
});
