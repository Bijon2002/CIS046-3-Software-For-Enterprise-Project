// A centralized socket manager for multiplayer rooms
const rooms = {};

module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log(`🔌 Player connected: ${socket.id}`);

        // Create a new multiplayer room
        socket.on("createRoom", ({ nickname, avatar, timerSetting }, callback) => {
            // Generate a 6-character alphanumeric room code
            const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

            rooms[roomCode] = {
                players: [{ id: socket.id, nickname, avatar, score: 0 }],
                timerSetting: timerSetting || 60,
                status: "waiting", // waiting | playing | finished
                timerId: null,
            };

            socket.join(roomCode);
            console.log(`🏠 Room ${roomCode} created by ${nickname} (${socket.id})`);
            callback({ success: true, roomCode });
        });

        // Join an existing room
        socket.on("joinRoom", ({ roomCode, nickname, avatar }, callback) => {
            const room = rooms[roomCode];

            if (!room) {
                return callback({ success: false, message: "Room not found or invalid code." });
            }
            if (room.status !== "waiting") {
                return callback({ success: false, message: "Game already in progress!" });
            }
            if (room.players.length >= 2) {
                return callback({ success: false, message: "Room is full!" });
            }

            // Add second player
            room.players.push({ id: socket.id, nickname, avatar, score: 0 });
            socket.join(roomCode);
            room.status = "playing"; // both are here, let's start!

            console.log(`🏠 ${nickname} joined Room ${roomCode}`);

            // Tell everyone in the room the game is starting and who is playing
            io.to(roomCode).emit("gameReady", {
                players: room.players,
                timer: room.timerSetting,
            });

            callback({ success: true });
        });

        // Handle real-time score updates
        socket.on("updateScore", ({ roomCode, score }) => {
            const room = rooms[roomCode];
            if (room && room.status === "playing") {
                const player = room.players.find((p) => p.id === socket.id);
                if (player) {
                    player.score = score;
                    // Broadcast updated scores to everyone in the room
                    io.to(roomCode).emit("scoreUpdate", room.players);
                }
            }
        });

        // End game unexpectedly (if someone leaves or host cancels)
        socket.on("disconnect", () => {
            console.log(`🛑 Player disconnected: ${socket.id}`);
            // Find any room this user was in
            for (const [code, room] of Object.entries(rooms)) {
                const pIndex = room.players.findIndex((p) => p.id === socket.id);
                if (pIndex !== -1) {
                    // If a player disconnects, automatically end the room
                    io.to(code).emit("opponentLeft", { message: "Opponent disconnected. Game over!" });
                    room.status = "finished";
                    if (room.timerId) clearInterval(room.timerId);
                    delete rooms[code]; // cleanup
                }
            }
        });
    });
};
