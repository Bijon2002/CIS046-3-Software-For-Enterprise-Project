const mongoose = require("mongoose");

const gameSessionSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
        score: { type: Number, default: 0 },
        puzzlesSolved: { type: Number, default: 0 },
        puzzlesAttempted: { type: Number, default: 0 },
        livesUsed: { type: Number, default: 0 },
        duration: { type: Number, default: 0 },
        xpEarned: { type: Number, default: 0 },
        fastestAnswer: { type: Number, default: null }, // milliseconds
        slowestAnswer: { type: Number, default: null },
        cherriesUsed: { type: Number, default: 0 }
    },
    { timestamps: true }
);

module.exports = mongoose.model("GameSession", gameSessionSchema);
