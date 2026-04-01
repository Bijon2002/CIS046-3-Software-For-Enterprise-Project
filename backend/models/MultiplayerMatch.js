const mongoose = require("mongoose");

const multiplayerMatchSchema = new mongoose.Schema(
    {
        roomCode: { type: String }, // Optional tracking for lobby
        playerOne: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        playerTwo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional if opponent rage quits immediately
        playerOneScore: { type: Number, default: 0 },
        playerTwoScore: { type: Number, default: 0 },
        winner: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // null if Tie
        duration: { type: Number }, // match length
    },
    { timestamps: true }
);

module.exports = mongoose.model("MultiplayerMatch", multiplayerMatchSchema);
