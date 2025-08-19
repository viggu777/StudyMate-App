// firebase.js
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDZwvqsaeclsn9Y93isRspWKCOol90EMvE",
  authDomain: "college-buddy-31666.firebaseapp.com",
  projectId: "college-buddy-31666",
  storageBucket: "college-buddy-31666.firebasestorage.app",
  messagingSenderId: "102439602713",
  appId: "1:102439602713:web:f4da499e9e4085e91d7888",
  measurementId: "G-K0CLVWL25X",
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { auth };
