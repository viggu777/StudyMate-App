const mongoose = require("mongoose");

const TimetableEntrySchema = new mongoose.Schema(
  {
    user_uid: {
      type: String,
      required: true,
    },
    day: { type: String, required: true },
    time: { type: String, required: true },
    subject: { type: String, required: true },
    // ✅ 'room' field has been removed.
    type: { type: String, default: "Lecture" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TimetableEntry", TimetableEntrySchema);
