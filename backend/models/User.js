const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    nickname: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    highestScore: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    cherries: { type: Number, default: 5 },
    profilePic: { type: String, default: "🐒" },
    completedObjectives: [{ type: String }],
    role: { type: String, enum: ["player", "admin"], default: "player" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);