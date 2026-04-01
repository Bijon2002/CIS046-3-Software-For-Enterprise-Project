const mongoose = require("mongoose");
const MultiplayerMatch = require("./backend/models/MultiplayerMatch");
mongoose.connect("mongodb+srv://game_development:bijon2002@bijon.x3gfbua.mongodb.net/").then(async () => {
    const matches = await MultiplayerMatch.find();
    console.log("Matches DB result:");
    console.log(JSON.stringify(matches, null, 2));
    process.exit(0);
}).catch(console.log);
