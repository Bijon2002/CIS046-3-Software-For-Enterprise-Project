require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io");
const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins for the game
    methods: ["GET", "POST"]
  }
});
require("./socket")(io);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🍌 Banana Game API Running...");
});

connectDB();

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);



const gameRoutes = require("./routes/gameRoutes");

app.use("/api/game", gameRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

app.get("/api/test", (req, res) => {
  res.json({ message: "Frontend ↔ Backend connected ✅" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server and Socket.io running on port ${PORT}`);
});