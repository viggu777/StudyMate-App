// screens/RegisterScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
  Animated,
} from "react-native";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [titleScale] = useState(new Animated.Value(0.8));

  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(titleScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!email || !password || !name) {
      Alert.alert("Please fill all fields");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      await updateProfile(userCred.user, { displayName: name });
    } catch (err) {
      console.error(err);
      Alert.alert("Registration failed", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ scale: titleScale }] }}>
            <View style={styles.titleContainer}>
              <Text style={styles.titleStudy}>Study</Text>
              <Text style={styles.titleMate}>Mate</Text>
            </View>
          </Animated.View>
          <Text style={styles.subtitle}>Create your account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Full name"
              style={styles.input}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              placeholderTextColor="#a0aec0"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Email"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#a0aec0"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Password (min 6 characters)"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#a0aec0"
            />
          </View>

          <TouchableOpacity
            style={[styles.createBtn, isLoading && styles.disabledBtn]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.createText}>
              {isLoading ? "Creating..." : "Create Account"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By signing up, you agree to our Terms & Privacy Policy
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>Login</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  titleStudy: {
    fontSize: 34,
    fontWeight: "800",
    color: "#2563eb",
  },
  titleMate: {
    fontSize: 34,
    fontWeight: "800",
    color: "#059669",
  },
  subtitle: {
    fontSize: 18,
    color: "#64748b",
    fontWeight: "500",
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 18,
  },
  input: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    color: "#1e293b",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  createBtn: {
    backgroundColor: "#059669",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 16,
    shadowColor: "#059669",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBtn: {
    backgroundColor: "#cbd5e0",
    shadowOpacity: 0,
    elevation: 0,
  },
  createText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
  terms: {
    fontSize: 13,
    textAlign: "center",
    color: "#64748b",
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 16,
    color: "#64748b",
    marginRight: 4,
  },
  linkText: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "600",
  },
});
