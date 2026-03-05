const crypto = require("crypto");
const Attempt = require("../models/Attempt");
const User = require("../models/User");

exports.getPuzzle = async (req, res) => {
  try {
    const r = await fetch(process.env.BANANA_API_URL);
    if (!r.ok) return res.status(502).json({ message: "Banana API error" });

    const data = await r.json();

    // ✅ Debug once (very useful)
    console.log("🍌 Banana API keys:", Object.keys(data));
    // console.log("🍌 Banana API raw:", data); // uncomment if needed

    // Banana API commonly uses: question + solution
    let image = data.image || data.question || data.img || data.base64;
    const solutionRaw = data.solution ?? data.answer ?? data.result;

    const correctAnswer = Number(solutionRaw);

    // Sometimes base64 already includes prefix "data:image/png;base64,"
    if (typeof image === "string" && image.startsWith("data:image")) {
      image = image.split(",")[1]; // keep only base64 part
    }

    if (!image || Number.isNaN(correctAnswer)) {
      return res.status(500).json({
        message: "Unexpected Banana API response",
        receivedKeys: Object.keys(data)
      });
    }

    const puzzleId = crypto.randomUUID();

    await Attempt.create({
      user: req.userId,
      puzzleId,
      image,
      correctAnswer
    });

    res.json({ puzzleId, image });
  } catch (err) {
    console.error("❌ getPuzzle error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("email score");
    res.json(user);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};


exports.submitAnswer = async (req, res) => {
  try {
    const { puzzleId, answer } = req.body;
    const ans = Number(answer);

    if (!puzzleId || Number.isNaN(ans)) {
      return res.status(400).json({ message: "puzzleId and numeric answer required" });
    }

    const attempt = await Attempt.findOne({ puzzleId, user: req.userId });
    if (!attempt) return res.status(404).json({ message: "Puzzle not found" });

    if (attempt.isCorrect !== null) {
      return res.status(400).json({ message: "Already submitted" });
    }

    const isCorrect = ans === attempt.correctAnswer;

    attempt.answer = ans;
    attempt.isCorrect = isCorrect;
    await attempt.save();

    if (isCorrect) {
      await User.findByIdAndUpdate(req.userId, { $inc: { score: 10 } });
    }

    const user = await User.findById(req.userId).select("score");

    res.json({
      isCorrect,
      correctAnswer: attempt.correctAnswer,
      score: user.score
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.leaderboard = async (req, res) => {
  try {
    const top = await User.find().select("email score").sort({ score: -1 }).limit(10);
    res.json(top);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};