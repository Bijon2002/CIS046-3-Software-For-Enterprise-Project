const mongoose = require("mongoose");
const MultiplayerMatch = require("./backend/models/MultiplayerMatch");
const User = require("./backend/models/User");

async function debug() {
    await mongoose.connect("mongodb+srv://game_development:bijon2002@bijon.x3gfbua.mongodb.net/");
    const me = await User.findOne({ nickname: "BIJON" }) || await User.findOne();
    if (!me) {
        console.log("No users found to test with.");
        process.exit(1);
    }
    
    console.log(`Using User: ${me.nickname} (${me._id})`);
    
    // Create a dummy match
    const dummy = await MultiplayerMatch.create({
        roomCode: "DEBUG1",
        playerOne: me._id,
        playerTwo: me._id, // match self for test
        playerOneScore: 100,
        playerTwoScore: 50,
        winner: me._id,
        duration: 30
    });
    
    console.log("Created dummy match:", dummy._id);
    
    const count = await MultiplayerMatch.countDocuments();
    console.log("Total Matches in DB:", count);
    
    const myHistory = await MultiplayerMatch.find({
        $or: [{ playerOne: me._id }, { playerTwo: me._id }]
    });
    console.log("Found matches for this user:", myHistory.length);
    
    process.exit(0);
}

debug();
