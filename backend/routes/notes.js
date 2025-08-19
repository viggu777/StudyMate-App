const express = require("express");
const router = express.Router();
const Note = require("../models/Note.js");
const { protect } = require("../middleware/authMiddleware.js");

// This line applies our security middleware to all routes in this file
router.use(protect);

// --- API Endpoints for Notes ---

// GET /api/notes - Get all notes for the logged-in user
router.get("/", async (req, res) => {
  try {
    const notes = await Note.find({ user_uid: req.user.uid }).sort({
      updatedAt: -1,
    });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// POST /api/notes - Create a new note
router.post("/", async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required." });
    }
    const newNote = await Note.create({
      user_uid: req.user.uid,
      title,
      content,
    });
    res.status(201).json(newNote);
  } catch (error) {
    res.status(400).json({ message: "Invalid data provided" });
  }
});

// PUT /api/notes/:id - Update a note
router.put("/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    // Security check: Make sure the user owns this note
    if (note.user_uid !== req.user.uid) {
      return res.status(401).json({ message: "User not authorized" });
    }
    const updatedNote = await Note.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updatedNote);
  } catch (error) {
    res.status(400).json({ message: "Error updating note" });
  }
});

// DELETE /api/notes/:id - Delete a note
router.delete("/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    // Security check: Make sure the user owns this note
    if (note.user_uid !== req.user.uid) {
      return res.status(401).json({ message: "User not authorized" });
    }
    await note.deleteOne();
    res.json({ message: "Note removed" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
