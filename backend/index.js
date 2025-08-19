const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db.js");
const admin = require("firebase-admin");

dotenv.config();
connectDB();

const serviceAccount = require("./config/serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Import Routes ---
const timetableRoutes = require("./routes/timetable.js");
const noteRoutes = require("./routes/notes.js"); // ✅ Import the new note routes

// --- Use Routes ---
app.use("/api/timetable", timetableRoutes);
app.use("/api/notes", noteRoutes); // ✅ Tell Express to use the note routes

// Listen on all network interfaces
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `✅ Backend server is running on port ${PORT} and is accessible on your network.`
  );
});
