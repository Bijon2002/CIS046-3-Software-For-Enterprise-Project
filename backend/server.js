require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

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


app.get("/api/test", (req, res) => {
  res.json({ message: "Frontend ↔ Backend connected ✅" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});