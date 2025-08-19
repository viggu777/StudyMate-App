// App.js
import "react-native-gesture-handler"; // must be first
import React, { useState, useEffect } from "react";
import { ActivityIndicator, View, Platform, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import * as Notifications from "expo-notifications";
import { Ionicons } from "@expo/vector-icons";

// Screens
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";
import PomodoroScreen from "./screens/PomodoroScreen";
import TimetableScreen from "./screens/TimetableScreen";
import NotesScreen from "./screens/NotesScreen";
import GPACalculatorScreen from "./screens/GPACalculatorScreen";

import useNotifications from "./components/Notification";

// --- ✨ App Theme Colors ---
const theme = {
  primary: "#2563eb", // Your "Study" blue
  secondary: "#059669", // Your "Mate" green
  inactive: "gray",
  headerText: "#ffffff",
};

// --- Navigators ---
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator with the new theme applied
function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // --- ✨ THE ONLY CHANGE IS HERE ---
        headerShown: false, // This completely removes the top blue bar

        // Dynamically set tab icons
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Pomodoro") {
            iconName = focused ? "timer" : "timer-outline";
          } else if (route.name === "Timetable") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Notes") {
            iconName = focused ? "document-text" : "document-text-outline";
          } else if (route.name === "GPA Calculator") {
            iconName = focused ? "calculator" : "calculator-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        // --- Applying Theme Colors to the Bottom Tab Bar ---
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.inactive,
        // We no longer need header styles because the header is gone
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Pomodoro" component={PomodoroScreen} />
      <Tab.Screen name="Timetable" component={TimetableScreen} />
      <Tab.Screen name="Notes" component={NotesScreen} />
      <Tab.Screen name="GPA Calculator" component={GPACalculatorScreen} />
    </Tab.Navigator>
  );
}

// Notification Handler (unchanged)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowAlert: true,
  }),
});

export default function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useNotifications();

  useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      }).catch((e) => console.warn("setNotificationChannelAsync failed:", e));
    }

    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      if (initializing) setInitializing(false);
    });

    return unsubscribe;
  }, [initializing]);

  if (initializing) {
    return (
      <View style={styles.container}>
        {/* Loading spinner now uses your theme color! */}
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          // Logged-in flow with the beautiful new theme
          <Stack.Screen
            name="Main"
            component={AppTabs}
            options={{ headerShown: false }}
          />
        ) : (
          // Auth flow
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
