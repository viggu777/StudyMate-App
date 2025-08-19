import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  TouchableOpacity,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { auth } from "../firebase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// 🔴 REMINDER: Replace this with your computer's local IP address
const API_URL = "http://10.238.87.49:3001/api/timetable";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const timeSlots = [
  "9 AM - 10 AM",
  "10 AM - 11 AM",
  "11 AM - 12 PM",
  "12 PM - 1 PM",
  "1 PM - 2 PM",
  "2 PM - 3 PM",
  "3 PM - 4 PM",
  "4 PM - 5 PM",
];

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
  lectureBg: "#e0e7ff",
  labBg: "#d1fae5",
  backgroundGradientEnd: "#f0f5ff",
};

const ClassCell = ({ classInfo, onEdit }) => {
  const cellStyle = [
    styles.classCell,
    classInfo.type === "Lab" ? styles.labCell : styles.lectureCell,
  ];
  return (
    <TouchableOpacity style={cellStyle} onPress={() => onEdit(classInfo)}>
      <Text style={styles.subjectText}>{classInfo.subject}</Text>
    </TouchableOpacity>
  );
};
const EmptyCell = () => <View style={styles.emptyCell} />;

export default function TimetableScreen() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentClass, setCurrentClass] = useState({
    _id: null,
    subject: "",
    day: "Mon",
    time: "9 AM - 10 AM",
    type: "Lecture",
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadSchedule();
      } else {
        setSchedule([]);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const loadSchedule = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch schedule");

      const data = await response.json();
      setSchedule(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not load your timetable.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    if (!currentClass.subject) {
      Alert.alert("Error", "Subject cannot be empty.");
      return;
    }
    const token = await auth.currentUser.getIdToken();
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing ? `${API_URL}/${currentClass._id}` : API_URL;

    const { id, ...classData } = currentClass;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(classData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save class");
      }
      setModalVisible(false);
      loadSchedule();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", `Could not save the class: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    if (!auth.currentUser || !isEditing) return;

    Alert.alert("Delete Class", "Are you sure you want to delete this class?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            const token = await auth.currentUser.getIdToken();
            const response = await fetch(`${API_URL}/${currentClass._id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to delete class");
            setModalVisible(false);
            loadSchedule();
          } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not delete the class.");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setCurrentClass({
      _id: null,
      subject: "",
      day: "Mon",
      time: "9 AM - 10 AM",
      type: "Lecture",
    });
    setModalVisible(true);
  };

  const handleOpenEditModal = (classToEdit) => {
    setIsEditing(true);
    setCurrentClass(classToEdit);
    setModalVisible(true);
  };

  const findClassForSlot = (day, time) =>
    schedule.find((item) => item.day === day && item.time === time);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text>Loading Timetable...</Text>
      </View>
    );
  }

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
          <Text style={styles.title}>Timetable</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleOpenAddModal}
          >
            <Ionicons name="add" size={22} color={theme.white} />
            <Text style={styles.addButtonText}>Add Class</Text>
          </TouchableOpacity>
        </View>
        <ScrollView>
          <View style={styles.gridContainer}>
            <View style={styles.daysHeader}>
              <View style={styles.timeHeaderCell} />
              {days.map((day) => (
                <View key={day} style={styles.dayHeaderCell}>
                  <Text style={styles.dayHeaderText}>{day}</Text>
                </View>
              ))}
            </View>
            {timeSlots.map((time) => (
              <View key={time} style={styles.scheduleRow}>
                <View style={styles.timeCell}>
                  <Text style={styles.timeText}>{time.split(" ")[0]}</Text>
                  <Text style={styles.timeMeridian}>{time.split(" ")[1]}</Text>
                </View>
                {days.map((day) => {
                  const classInfo = findClassForSlot(day, time);
                  return (
                    <View key={`${day}-${time}`} style={styles.cellWrapper}>
                      {classInfo ? (
                        <ClassCell
                          classInfo={classInfo}
                          onEdit={handleOpenEditModal}
                        />
                      ) : (
                        <EmptyCell />
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setModalVisible(false)}
          >
            <Pressable style={styles.modalContent} onPress={() => {}}>
              <Text style={styles.modalTitle}>
                {isEditing ? "Edit Class" : "Add New Class"}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Subject Name (e.g., Maths I)"
                value={currentClass.subject}
                onChangeText={(text) =>
                  setCurrentClass({ ...currentClass, subject: text })
                }
              />

              <Text style={styles.pickerLabel}>Day of the Week</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={currentClass.day}
                  onValueChange={(itemValue) =>
                    setCurrentClass({ ...currentClass, day: itemValue })
                  }
                >
                  {days.map((day) => (
                    <Picker.Item key={day} label={day} value={day} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.pickerLabel}>Time Slot</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={currentClass.time}
                  onValueChange={(itemValue) =>
                    setCurrentClass({ ...currentClass, time: itemValue })
                  }
                >
                  {timeSlots.map((slot) => (
                    <Picker.Item key={slot} label={slot} value={slot} />
                  ))}
                </Picker>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
              {isEditing && (
                <TouchableOpacity
                  style={[styles.button, styles.deleteButton]}
                  onPress={handleDelete}
                >
                  <Text style={styles.buttonText}>Delete Class</Text>
                </TouchableOpacity>
              )}
            </Pressable>
          </Pressable>
        </Modal>
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.lightGray,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "transparent",
  },
  title: { fontSize: 24, fontWeight: "bold", color: theme.white },
  addButton: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: { color: theme.white, fontWeight: "bold", marginLeft: 5 },
  gridContainer: {
    paddingHorizontal: 10,
    marginTop: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    paddingBottom: 10,
  },
  daysHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#dee2e6",
  },
  dayHeaderCell: { flex: 1, padding: 10, alignItems: "center" },
  dayHeaderText: { fontWeight: "bold", color: theme.darkGray },
  timeHeaderCell: { width: 70, padding: 10 },
  scheduleRow: { flexDirection: "row", minHeight: 80 },
  timeCell: {
    width: 70,
    padding: 10,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  timeText: { fontWeight: "500", fontSize: 12, color: theme.mediumGray },
  timeMeridian: { fontSize: 10, color: "#adb5bd" },
  cellWrapper: {
    flex: 1,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "#e5e7eb",
  },
  classCell: {
    flex: 1,
    borderRadius: 8,
    padding: 8,
    margin: 4,
    justifyContent: "center",
  },
  lectureCell: { backgroundColor: theme.lectureBg },
  labCell: { backgroundColor: theme.labBg },
  subjectText: {
    fontWeight: "bold",
    fontSize: 14,
    color: theme.darkGray,
    textAlign: "center",
  },
  emptyCell: { flex: 1, backgroundColor: "transparent" },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: theme.white,
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: theme.darkGray,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: theme.lightGray,
    fontSize: 16,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.darkGray,
    marginBottom: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
    justifyContent: "center",
    backgroundColor: theme.lightGray,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: { padding: 12, borderRadius: 8, alignItems: "center", flex: 1 },
  buttonText: { color: theme.white, fontWeight: "bold", fontSize: 16 },
  saveButton: { backgroundColor: theme.secondary, marginRight: 10 },
  cancelButton: { backgroundColor: theme.mediumGray },
  deleteButton: { backgroundColor: theme.danger, marginTop: 10 },
});
