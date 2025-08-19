const express = require("express");
const router = express.Router();
const TimetableEntry = require("../models/TimetableEntry.js");
const { protect } = require("../middleware/authMiddleware.js");

router.use(protect); // Protect all routes in this file

// GET all entries for the logged-in user
router.get("/", async (req, res) => {
  try {
    const entries = await TimetableEntry.find({ user_uid: req.user.uid });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// POST a new entry for the logged-in user
router.post("/", async (req, res) => {
  try {
    const { day, time, subject, type } = req.body; // 'room' is removed
    const newEntry = await TimetableEntry.create({
      user_uid: req.user.uid,
      day,
      time,
      subject,
      type,
    });
    res.status(201).json(newEntry);
  } catch (error) {
    res.status(400).json({ message: "Invalid data" });
  }
});

// ✅ PUT (Update) an entry by its ID
router.put("/:id", async (req, res) => {
  try {
    const entry = await TimetableEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: "Class not found" });
    }
    // Security Check: Make sure the user owns this entry
    if (entry.user_uid !== req.user.uid) {
      return res.status(401).json({ message: "User not authorized" });
    }

    const updatedEntry = await TimetableEntry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedEntry);
  } catch (error) {
    res.status(400).json({ message: "Error updating class" });
  }
});

// ✅ DELETE an entry by its ID
router.delete("/:id", async (req, res) => {
  try {
    const entry = await TimetableEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "Class not found" });
    }
    // Security Check: Make sure the user owns this entry
    if (entry.user_uid !== req.user.uid) {
      return res.status(401).json({ message: "User not authorized" });
    }
    await entry.deleteOne();
    res.json({ message: "Class removed" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
