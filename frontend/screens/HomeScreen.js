import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
// To use the new gradient header, you'll need to install this package:
// npm install expo-linear-gradient
import { LinearGradient } from "expo-linear-gradient";

const PINNED_TASK_KEY = "@StudyMate:pinnedTask";

// --- Theme Colors (consistent with App.js) ---
const theme = {
  primary: "#2563eb",
  primaryLight: "#3b82f6",
  backgroundGradientEnd: "#f0f5ff", // A very light blue for the bottom of the gradient
  secondary: "#059669",
  lightGray: "#f3f4f6",
  mediumGray: "#6b7280",
  darkGray: "#1f2937",
  white: "#ffffff",
};

// --- Motivational Quotes ---
const motivationalQuotes = [
  {
    quote: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
  },
  {
    quote: "It’s not whether you get knocked down, it’s whether you get up.",
    author: "Vince Lombardi",
  },
  {
    quote:
      "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
  },
  { quote: "Well done is better than well said.", author: "Benjamin Franklin" },
  { quote: "Strive for progress, not perfection.", author: "Unknown" },
];

export default function HomeScreen({ navigation }) {
  const user = auth.currentUser;
  const [pinnedTask, setPinnedTask] = useState("");
  const [dailyQuote, setDailyQuote] = useState({ quote: "", author: "" });

  useEffect(() => {
    const dayOfYear = Math.floor(
      (new Date() - new Date(new Date().getFullYear(), 0, 0)) /
        1000 /
        60 /
        60 /
        24
    );
    setDailyQuote(motivationalQuotes[dayOfYear % motivationalQuotes.length]);

    const loadTask = async () => {
      try {
        const task = await AsyncStorage.getItem(PINNED_TASK_KEY);
        if (task !== null) {
          setPinnedTask(task);
        }
      } catch (e) {
        console.error("Failed to load pinned task.", e);
      }
    };
    loadTask();
  }, []);

  const handleSavePinnedTask = async () => {
    if (!pinnedTask.trim()) {
      Alert.alert("Empty Task", "Please enter a task before pinning.");
      return;
    }
    try {
      await AsyncStorage.setItem(PINNED_TASK_KEY, pinnedTask);
      Alert.alert("Success", "Your task has been pinned!");
    } catch (e) {
      Alert.alert("Error", "Failed to save the task.");
      console.error("Failed to save pinned task.", e);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
      Alert.alert("Error", "Failed to sign out.");
    }
  };

  return (
    <LinearGradient
      colors={[theme.primary, theme.backgroundGradientEnd]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />

        {/* --- Simplified Header --- */}
        <View style={styles.header}>
          <Text style={styles.userName} numberOfLines={1}>
            Hello, {user?.displayName || "User"}
          </Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={28} color={theme.white} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.contentArea}>
            {/* Pinned Task Widget */}
            <View style={styles.widgetCard}>
              <Text style={styles.sectionTitle}>Today's Pinned Task</Text>
              <TextInput
                style={styles.pinnedTaskInput}
                placeholder="What's your main goal today?"
                placeholderTextColor={theme.mediumGray}
                value={pinnedTask}
                onChangeText={setPinnedTask}
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSavePinnedTask}
              >
                <Text style={styles.saveButtonText}>Pin Task</Text>
              </TouchableOpacity>
            </View>

            {/* Quote of the Day Widget */}
            <View style={styles.quoteCard}>
              <Text style={styles.quoteText}>“{dailyQuote.quote}”</Text>
              <Text style={styles.quoteAuthor}>- {dailyQuote.author}</Text>
            </View>

            {/* Features Grid */}
            <View style={styles.featuresContainer}>
              <Text style={styles.sectionTitle}>Your Tools</Text>
              <View style={styles.grid}>
                <FeatureCard
                  iconName="timer-outline"
                  title="Pomodoro Timer"
                  onPress={() => navigation.navigate("Pomodoro")}
                />
                <FeatureCard
                  iconName="calendar-clear-outline"
                  title="Timetable"
                  onPress={() => navigation.navigate("Timetable")}
                />
                <FeatureCard
                  iconName="document-text-outline"
                  title="Quick Notes"
                  onPress={() => navigation.navigate("Notes")}
                />
                <FeatureCard
                  iconName="calculator-outline"
                  title="GPA Calculator"
                  onPress={() => navigation.navigate("GPA Calculator")}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Reusable component for feature cards using Ionicons
const FeatureCard = ({ iconName, title, onPress }) => (
  <TouchableOpacity style={styles.featureCard} onPress={onPress}>
    <Ionicons
      name={iconName}
      size={40}
      color={theme.primary}
      style={styles.cardIcon}
    />
    <Text style={styles.cardTitle}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.white,
  },
  logoutIcon: {
    padding: 8,
  },
  contentArea: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  widgetCard: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)", // Slightly transparent white
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: theme.darkGray,
  },
  pinnedTaskInput: {
    backgroundColor: theme.lightGray,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    color: theme.darkGray,
  },
  saveButton: {
    backgroundColor: theme.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: theme.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  quoteCard: {
    backgroundColor: "rgba(224, 231, 255, 0.9)", // Slightly transparent light blue
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    alignItems: "center",
  },
  quoteText: {
    fontSize: 16,
    color: theme.darkGray,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 14,
    color: theme.mediumGray,
    fontWeight: "600",
  },
  featuresContainer: {
    marginBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  featureCard: {
    width: "48%",
    aspectRatio: 1,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 5,
  },
  cardIcon: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    color: theme.darkGray,
  },
});
