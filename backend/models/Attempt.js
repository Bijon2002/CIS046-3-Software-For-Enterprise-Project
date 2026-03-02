const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		puzzleId: { type: String, required: true, unique: true, index: true },
		image: { type: String, required: true }, // base64
		correctAnswer: { type: Number, required: true },
		answer: { type: Number, default: null },
		isCorrect: { type: Boolean, default: null }
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Attempt", attemptSchema);

