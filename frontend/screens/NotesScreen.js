import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  TouchableOpacity,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { auth } from "../firebase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// 🔴 CRUCIAL: COPY THE WORKING IP ADDRESS FROM YOUR TimetableScreen.js
// AND PASTE IT HERE. IT MUST BE IDENTICAL.
const API_URL = "http://10.238.87.49:3001/api/notes";

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

export default function NotesScreen() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNote, setCurrentNote] = useState({
    _id: null,
    title: "",
    content: "",
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadNotes();
      } else {
        setNotes([]);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const loadNotes = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch notes from server");
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Error",
        "Could not load notes. Please check the server connection."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!auth.currentUser) return;
    if (!currentNote.title || !currentNote.content) {
      Alert.alert("Error", "Title and content cannot be empty.");
      return;
    }

    const token = await auth.currentUser.getIdToken();
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing ? `${API_URL}/${currentNote._id}` : API_URL;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: currentNote.title,
          content: currentNote.content,
        }),
      });

      if (!response.ok) throw new Error("Failed to save note");

      setModalVisible(false);
      loadNotes();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not save the note.");
    }
  };

  const handleDeleteNote = () => {
    if (!auth.currentUser || !isEditing) return;
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            const token = await auth.currentUser.getIdToken();
            const response = await fetch(`${API_URL}/${currentNote._id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to delete note");
            setModalVisible(false);
            loadNotes();
          } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not delete the note.");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setCurrentNote({ _id: null, title: "", content: "" });
    setModalVisible(true);
  };

  const handleOpenEditModal = (note) => {
    setIsEditing(true);
    setCurrentNote(note);
    setModalVisible(true);
  };

  const renderNote = ({ item }) => (
    <TouchableOpacity
      style={styles.noteCard}
      onPress={() => handleOpenEditModal(item)}
    >
      <Text style={styles.noteTitle}>{item.title}</Text>
      <Text style={styles.noteContent} numberOfLines={3}>
        {item.content}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text>Loading Notes...</Text>
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
          <Text style={styles.title}>Quick Notes</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleOpenAddModal}
          >
            <Ionicons name="add" size={22} color={theme.white} />
            <Text style={styles.addButtonText}>Add Note</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={notes}
          renderItem={renderNote}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No notes yet. Tap '+ Add Note' to create one!
              </Text>
            </View>
          }
        />

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
                {isEditing ? "Edit Note" : "Add New Note"}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Note Title"
                value={currentNote.title}
                onChangeText={(text) =>
                  setCurrentNote({ ...currentNote, title: text })
                }
              />
              <TextInput
                style={[styles.input, styles.contentInput]}
                placeholder="Note Content"
                value={currentNote.content}
                onChangeText={(text) =>
                  setCurrentNote({ ...currentNote, content: text })
                }
                multiline={true}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSaveNote}
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
                  onPress={handleDeleteNote}
                >
                  <Text style={styles.buttonText}>Delete Note</Text>
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
  listContainer: { paddingHorizontal: 16, paddingTop: 16 },
  noteCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: theme.darkGray,
  },
  noteContent: { fontSize: 14, color: theme.mediumGray },
  emptyContainer: {
    marginTop: 50,
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: theme.white,
    fontSize: 16,
    fontWeight: "500",
  },
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
  contentInput: { height: 120, textAlignVertical: "top" },
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
