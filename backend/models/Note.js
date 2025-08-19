const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema(
  {
    user_uid: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: [true, "Please add a title"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Please add content"],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

module.exports = mongoose.model("Note", NoteSchema);
