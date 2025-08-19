import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useNotifications from "../components/Notification";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const STORAGE_KEY = "@StudyMate:pomodoro_sessions";

// --- Theme Colors (consistent with App.js) ---
const theme = {
  primary: "#2563eb",
  secondary: "#059669",
  lightGray: "#f3f4f6",
  mediumGray: "#6b7280",
  darkGray: "#1f2937",
  white: "#ffffff",
  danger: "#ef4444",
  warning: "#f59e0b",
  backgroundGradientEnd: "#f0f5ff", // Added for gradient
};

export default function PomodoroScreen() {
  const { scheduleLocalNotification, cancelScheduledNotification } =
    useNotifications();
  const [workMinutes, setWorkMinutes] = useState("25");
  const [shortBreakMinutes, setShortBreakMinutes] = useState("5");
  const [longBreakMinutes, setLongBreakMinutes] = useState("15");
  const [cyclesBeforeLongBreak, setCyclesBeforeLongBreak] = useState("4");
  const [workDuration, setWorkDuration] = useState(25 * 60);
  const [breakDuration, setBreakDuration] = useState(5 * 60);
  const [longBreakDuration, setLongBreakDuration] = useState(15 * 60);
  const [cyclesRequired, setCyclesRequired] = useState(4);
  const [mode, setMode] = useState("work");
  const [timer, setTimer] = useState(workDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const scheduledNotificationIdRef = useRef(null);
  const [sessions, setSessions] = useState([]);
  const [todayMinutes, setTodayMinutes] = useState(0);

  useEffect(() => {
    loadSessions();
    applySettings();
  }, []);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            handleTimerEnd();
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleTimerEnd = async () => {
    setIsRunning(false);
    await cancelScheduledNotification(scheduledNotificationIdRef.current);
    scheduledNotificationIdRef.current = null;

    if (mode === "work") {
      const end = Date.now();
      const st = startTime || end - workDuration * 1000;
      const durationSec = Math.round((end - st) / 1000);
      const session = {
        id: Date.now().toString(),
        mode: "work",
        start: st,
        end,
        duration: durationSec,
      };
      await storeSession(session);
      setStartTime(null);

      await scheduleLocalNotification(1, {
        title: "Great Job! 🎉",
        body: "Work session finished. Time for a break.",
      });

      setMode("workFinished");
      setCyclesCompleted((prev) => prev + 1);
    } else {
      setMode("work");
      setTimer(workDuration);
      setTimeout(() => {
        startTimer();
      }, 1000);
    }
  };

  const startBreak = () => {
    const nextIsLong =
      cyclesCompleted > 0 && cyclesCompleted % cyclesRequired === 0;
    if (nextIsLong) {
      setMode("longBreak");
    } else {
      setMode("break");
    }
    setTimeout(() => {
      startTimer();
    }, 250);
  };

  const startTimer = async () => {
    if (isRunning) return;

    let duration;
    let title;
    let body;

    if (mode === "work") {
      duration = workDuration;
      title = "Work Session Started 🚀";
      body = "Time to focus!";
    } else {
      duration = mode === "break" ? breakDuration : longBreakDuration;
      title = "Break Started ☕️";
      body = "Time to relax and recharge!";
      await scheduleEndOfSessionNotification(duration);
    }

    setTimer(duration);
    await scheduleLocalNotification(1, { title, body });

    if (mode === "work") {
      setStartTime(Date.now());
    }
    setIsRunning(true);
  };

  const scheduleEndOfSessionNotification = async (remainingSeconds) => {
    await cancelScheduledNotification(scheduledNotificationIdRef.current);
    const title = "Break's Over!";
    const body = "Time to get back to work.";
    const id = await scheduleLocalNotification(remainingSeconds, {
      title,
      body,
      data: { screen: "Pomodoro" },
    });
    scheduledNotificationIdRef.current = id;
  };

  const pauseTimer = async () => {
    setIsRunning(false);
    await cancelScheduledNotification(scheduledNotificationIdRef.current);
  };

  const resetTimer = async () => {
    await pauseTimer();
    setMode("work");
    setTimer(workDuration);
    setCyclesCompleted(0);
    setStartTime(null);
  };

  const manualSwitchMode = async (newMode) => {
    await pauseTimer();
    setMode(newMode);
    if (newMode === "work") setTimer(workDuration);
    else if (newMode === "break") setTimer(breakDuration);
    else setTimer(longBreakDuration);
    setStartTime(null);
  };

  const applySettings = () => {
    const parseAndValidate = (value, defaultValue) => {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue : Math.max(1, parsed);
    };
    const w = parseAndValidate(workMinutes, 25);
    const s = parseAndValidate(shortBreakMinutes, 5);
    const l = parseAndValidate(longBreakMinutes, 15);
    const c = parseAndValidate(cyclesBeforeLongBreak, 4);
    setWorkDuration(w * 60);
    setBreakDuration(s * 60);
    setLongBreakDuration(l * 60);
    setCyclesRequired(c);
    if (!isRunning) {
      if (mode === "work") setTimer(w * 60);
      else if (mode === "break") setTimer(s * 60);
      else setTimer(l * 60);
    }
  };

  const formatTime = (sec) => {
    const s = Math.max(0, Math.floor(sec));
    const mm = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const storeSession = async (session) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      const newArr = [session, ...arr];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newArr));
      setSessions(newArr);
      computeTodayTotal(newArr);
    } catch (e) {
      console.log("storeSession error:", e);
    }
  };

  const loadSessions = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      setSessions(arr);
      computeTodayTotal(arr);
    } catch (e) {
      console.log("loadSessions error:", e);
    }
  };

  const computeTodayTotal = (arr) => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();
    const totalSec = arr.reduce((acc, s) => {
      const st = new Date(s.start);
      if (st.getFullYear() === y && st.getMonth() === m && st.getDate() === d) {
        return acc + (s.duration || 0);
      }
      return acc;
    }, 0);
    setTodayMinutes(Math.round(totalSec / 60));
  };

  const saveSettingsHandler = () => {
    applySettings();
    Alert.alert(
      "Settings Saved",
      "Your new timer durations have been applied."
    );
  };

  const clearHistory = async () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to delete all session history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(STORAGE_KEY);
              setSessions([]);
              setTodayMinutes(0);
            } catch (e) {
              Alert.alert("Error", "Could not clear history.");
            }
          },
        },
      ]
    );
  };

  const renderSession = ({ item }) => (
    <View style={styles.sessionRow}>
      <Text style={styles.sessionText}>
        <Ionicons name="time-outline" size={16} color={theme.primary} />{" "}
        {new Date(item.start).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
      <Text style={styles.sessionText}>
        {Math.round(item.duration / 60)} min
      </Text>
    </View>
  );

  const ListHeader = () => (
    <>
      <View style={styles.timerCard}>
        <Text style={styles.modeText}>
          {mode === "work"
            ? "Focus Time"
            : mode === "break"
            ? "Short Break"
            : mode === "longBreak"
            ? "Long Break"
            : "Session Complete!"}
        </Text>

        <Text style={styles.timerText}>{formatTime(timer)}</Text>

        {mode === "workFinished" ? (
          <TouchableOpacity style={styles.button} onPress={startBreak}>
            <Text style={styles.buttonText}>Start Break</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.controlsRow}>
            {!isRunning ? (
              <TouchableOpacity style={styles.button} onPress={startTimer}>
                <Ionicons name="play" size={20} color={theme.white} />
                <Text style={styles.buttonText}>Start</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.pause]}
                onPress={pauseTimer}
              >
                <Ionicons name="pause" size={20} color={theme.white} />
                <Text style={styles.buttonText}>Pause</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, styles.reset]}
              onPress={resetTimer}
            >
              <Ionicons name="refresh" size={20} color={theme.white} />
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.modeSwitchRow}>
          <TouchableOpacity
            style={[styles.smallBtn, mode === "work" && styles.smallBtnActive]}
            onPress={() => manualSwitchMode("work")}
          >
            <Text
              style={[
                styles.smallBtnText,
                mode === "work" && styles.smallBtnActiveText,
              ]}
            >
              Work
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallBtn, mode === "break" && styles.smallBtnActive]}
            onPress={() => manualSwitchMode("break")}
          >
            <Text
              style={[
                styles.smallBtnText,
                mode === "break" && styles.smallBtnActiveText,
              ]}
            >
              Short Break
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.smallBtn,
              mode === "longBreak" && styles.smallBtnActive,
            ]}
            onPress={() => manualSwitchMode("longBreak")}
          >
            <Text
              style={[
                styles.smallBtnText,
                mode === "longBreak" && styles.smallBtnActiveText,
              ]}
            >
              Long Break
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          Today's Focus:{" "}
          <Text style={{ fontWeight: "bold" }}>{todayMinutes} min</Text>
        </Text>
        <Text style={styles.infoText}>
          Cycles Completed:{" "}
          <Text style={{ fontWeight: "bold" }}>{cyclesCompleted}</Text>
        </Text>
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>Settings (minutes)</Text>
        <View style={styles.settingsRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Work</Text>
            <TextInput
              style={styles.smallInput}
              keyboardType="numeric"
              value={workMinutes}
              onChangeText={setWorkMinutes}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Break</Text>
            <TextInput
              style={styles.smallInput}
              keyboardType="numeric"
              value={shortBreakMinutes}
              onChangeText={setShortBreakMinutes}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Long Break</Text>
            <TextInput
              style={styles.smallInput}
              keyboardType="numeric"
              value={longBreakMinutes}
              onChangeText={setLongBreakMinutes}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cycles</Text>
            <TextInput
              style={styles.smallInput}
              keyboardType="numeric"
              value={cyclesBeforeLongBreak}
              onChangeText={setCyclesBeforeLongBreak}
            />
          </View>
        </View>
        <View style={{ flexDirection: "row", marginTop: 16 }}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={saveSettingsHandler}
          >
            <Text style={styles.saveBtnText}>Save Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: theme.mediumGray, marginLeft: 8 },
            ]}
            onPress={clearHistory}
          >
            <Text style={styles.saveBtnText}>Clear History</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.historyHeader}>
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
      </View>
    </>
  );

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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pomodoro</Text>
        </View>
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ color: theme.mediumGray }}>No sessions yet</Text>
            </View>
          }
          contentContainerStyle={styles.listContentContainer}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    backgroundColor: "transparent",
    paddingVertical: 15,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.white,
    textAlign: "center",
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  timerCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modeText: {
    fontSize: 18,
    marginBottom: 8,
    color: theme.mediumGray,
    fontWeight: "600",
  },
  timerText: {
    fontSize: 64,
    fontWeight: "bold",
    color: theme.darkGray,
    marginBottom: 10,
  },
  controlsRow: { flexDirection: "row", marginTop: 20 },
  button: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: theme.primary,
    borderRadius: 10,
    marginHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pause: { backgroundColor: theme.warning },
  reset: { backgroundColor: theme.danger },
  buttonText: {
    color: theme.white,
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  modeSwitchRow: {
    flexDirection: "row",
    marginTop: 20,
    backgroundColor: theme.lightGray,
    borderRadius: 20,
    padding: 4,
  },
  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginHorizontal: 2,
  },
  smallBtnActive: {
    backgroundColor: theme.primary,
  },
  smallBtnText: {
    fontWeight: "600",
    color: theme.darkGray,
  },
  smallBtnActiveText: {
    color: theme.white,
  },
  infoCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "rgba(224, 231, 255, 0.9)",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  infoText: {
    fontSize: 16,
    color: theme.darkGray,
  },
  settingsCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: theme.darkGray,
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  inputGroup: { flex: 1, alignItems: "center", marginHorizontal: 5 },
  label: {
    fontSize: 14,
    color: theme.darkGray,
    marginBottom: 6,
    fontWeight: "500",
  },
  smallInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: theme.lightGray,
    padding: 10,
    borderRadius: 8,
    width: "100%",
    textAlign: "center",
    fontSize: 16,
    color: theme.darkGray,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: theme.secondary,
    borderRadius: 10,
    alignItems: "center",
  },
  saveBtnText: {
    color: theme.white,
    fontWeight: "bold",
  },
  historyHeader: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  sessionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: theme.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.lightGray,
  },
  sessionText: {
    fontSize: 16,
    color: theme.darkGray,
  },
  emptyContainer: {
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    alignItems: "center",
  },
});
