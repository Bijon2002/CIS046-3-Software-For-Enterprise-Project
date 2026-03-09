const crypto = require("crypto");
const Attempt = require("../models/Attempt");
const User = require("../models/User");
const GameSession = require("../models/GameSession");

/* ================================================================
   RANKS & OBJECTIVES — shared constants
   ================================================================ */

const RANKS = [
  { name: "Seedling", icon: "🌱", xp: 0 },
  { name: "Sprout", icon: "🌿", xp: 100 },
  { name: "Explorer", icon: "🧭", xp: 300 },
  { name: "Warrior", icon: "⚔️", xp: 600 },
  { name: "Knight", icon: "🛡️", xp: 1000 },
  { name: "Champion", icon: "🏅", xp: 1500 },
  { name: "Hero", icon: "🦸", xp: 2200 },
  { name: "Master", icon: "👑", xp: 3000 },
  { name: "Grandmaster", icon: "💎", xp: 4000 },
  { name: "Legend", icon: "🔱", xp: 5500 },
];

const DIFF_MULT = { easy: 1, medium: 1.5, hard: 2 };

const OBJECTIVES = [
  { id: "first_steps", name: "First Steps", desc: "Play 1 game", xp: 20, cherries: 0 },
  { id: "dedicated_player", name: "Dedicated Player", desc: "Play 10 games total", xp: 50, cherries: 1 },
  { id: "marathon_runner", name: "Marathon Runner", desc: "Play 50 games total", xp: 100, cherries: 2 },
  { id: "speed_demon", name: "Speed Demon", desc: "Answer within 1 second", xp: 30, cherries: 0 },
  { id: "clutch_master", name: "Clutch Master", desc: "Answer in last 2 seconds", xp: 40, cherries: 1 },
  { id: "perfect_game", name: "Perfect Game", desc: "Solve 5+ puzzles with 0 wrong", xp: 80, cherries: 2 },
  { id: "hard_survivor", name: "Hard Survivor", desc: "Win 3+ puzzles on Hard", xp: 60, cherries: 1 },
  { id: "century_club", name: "Century Club", desc: "Score 100+ in one match", xp: 100, cherries: 3 },
  { id: "daily_warrior", name: "Daily Warrior", desc: "Play 5 games in one day", xp: 40, cherries: 1 },
  { id: "brain_lord", name: "Brain Lord", desc: "Reach 500 total XP", xp: 50, cherries: 2 },
];

function getRank(xp) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.xp) rank = r;
    else break;
  }
  const idx = RANKS.indexOf(rank);
  const next = RANKS[idx + 1] || null;
  return { current: rank, next, index: idx };
}

/* Check which NEW objectives were completed */
async function checkObjectives(user, sessionData) {
  const completed = user.completedObjectives || [];
  const newlyCompleted = [];

  const totalGames = await GameSession.countDocuments({ user: user._id });

  for (const obj of OBJECTIVES) {
    if (completed.includes(obj.id)) continue;

    let achieved = false;

    switch (obj.id) {
      case "first_steps":
        achieved = totalGames >= 1;
        break;
      case "dedicated_player":
        achieved = totalGames >= 10;
        break;
      case "marathon_runner":
        achieved = totalGames >= 50;
        break;
      case "speed_demon":
        achieved = sessionData.fastestAnswer != null && sessionData.fastestAnswer <= 1000;
        break;
      case "clutch_master":
        achieved = sessionData.clutchAnswer === true;
        break;
      case "perfect_game":
        achieved = sessionData.puzzlesSolved >= 5 && sessionData.puzzlesAttempted === sessionData.puzzlesSolved;
        break;
      case "hard_survivor":
        achieved = sessionData.difficulty === "hard" && sessionData.puzzlesSolved >= 3;
        break;
      case "century_club":
        achieved = sessionData.score >= 100;
        break;
      case "daily_warrior": {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayGames = await GameSession.countDocuments({
          user: user._id,
          createdAt: { $gte: todayStart }
        });
        achieved = todayGames >= 5;
        break;
      }
      case "brain_lord":
        achieved = (user.xp + (sessionData.xpEarned || 0)) >= 500;
        break;
    }

    if (achieved) newlyCompleted.push(obj);
  }

  return newlyCompleted;
}

/* ================================================================
   CONTROLLERS
   ================================================================ */

exports.getPuzzle = async (req, res) => {
  try {
    const r = await fetch(process.env.BANANA_API_URL);
    if (!r.ok) return res.status(502).json({ message: "Banana API error" });

    const data = await r.json();
    console.log("🍌 Banana API keys:", Object.keys(data));

    let image = data.image || data.question || data.img || data.base64;
    const solutionRaw = data.solution ?? data.answer ?? data.result;
    const correctAnswer = Number(solutionRaw);

    if (typeof image === "string" && image.startsWith("data:image")) {
      image = image.split(",")[1];
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
    const user = await User.findById(req.userId)
      .select("nickname email highestScore role xp cherries profilePic completedObjectives");
    const rankInfo = getRank(user.xp);
    res.json({ ...user.toObject(), rank: rankInfo });
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

    res.json({ isCorrect, correctAnswer: attempt.correctAnswer });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.saveGameSession = async (req, res) => {
  try {
    const {
      difficulty, score, puzzlesSolved, puzzlesAttempted,
      livesUsed, duration, fastestAnswer, slowestAnswer,
      cherriesUsed, clutchAnswer
    } = req.body;

    if (!difficulty || score == null) {
      return res.status(400).json({ message: "difficulty and score required" });
    }

    // Calculate XP
    const mult = DIFF_MULT[difficulty] || 1;
    const xpEarned = Math.round(Number(score) * mult);

    const session = await GameSession.create({
      user: req.userId,
      difficulty,
      score: Number(score),
      puzzlesSolved: Number(puzzlesSolved) || 0,
      puzzlesAttempted: Number(puzzlesAttempted) || 0,
      livesUsed: Number(livesUsed) || 0,
      duration: Number(duration) || 0,
      xpEarned,
      fastestAnswer: fastestAnswer != null ? Number(fastestAnswer) : null,
      slowestAnswer: slowestAnswer != null ? Number(slowestAnswer) : null,
      cherriesUsed: Number(cherriesUsed) || 0,
    });

    // Update user
    const user = await User.findById(req.userId);
    user.xp += xpEarned;
    if (Number(score) > user.highestScore) {
      user.highestScore = Number(score);
    }

    // Check objectives
    const newObjectives = await checkObjectives(user, {
      ...req.body,
      xpEarned,
      puzzlesSolved: Number(puzzlesSolved) || 0,
      puzzlesAttempted: Number(puzzlesAttempted) || 0,
    });

    let objectiveXP = 0;
    let objectiveCherries = 0;
    for (const obj of newObjectives) {
      user.completedObjectives.push(obj.id);
      objectiveXP += obj.xp;
      objectiveCherries += obj.cherries;
    }
    user.xp += objectiveXP;
    user.cherries += objectiveCherries;

    await user.save();

    const rankInfo = getRank(user.xp);

    res.json({
      session,
      xpEarned,
      objectiveXP,
      objectiveCherries,
      newObjectives: newObjectives.map(o => ({ id: o.id, name: o.name, xp: o.xp, cherries: o.cherries })),
      highestScore: user.highestScore,
      totalXP: user.xp,
      cherries: user.cherries,
      rank: rankInfo,
    });
  } catch (err) {
    console.error("❌ saveGameSession error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.useCherry = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.cherries <= 0) {
      return res.status(400).json({ message: "No cherries left!" });
    }
    user.cherries -= 1;
    await user.save();
    res.json({ cherries: user.cherries });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.buyCherry = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.xp < 50) {
      return res.status(400).json({ message: "Not enough XP (need 50)" });
    }
    user.xp -= 50;
    user.cherries += 1;
    await user.save();
    const rankInfo = getRank(user.xp);
    res.json({ xp: user.xp, cherries: user.cherries, rank: rankInfo });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateProfilePic = async (req, res) => {
  try {
    const { profilePic } = req.body;
    if (!profilePic) {
      return res.status(400).json({ message: "profilePic required" });
    }

    const ALLOWED_EMOJIS = ["🐒", "🦁", "🐯", "🦊", "🐼", "🐨", "🦜", "🐸"];
    const ALLOWED_DICEBEAR = [
      "adventurer", "pixel-art", "bottts", "lorelei",
      "fun-emoji", "croodles", "micah", "shapes",
    ];

    const isEmoji = ALLOWED_EMOJIS.includes(profilePic);
    const isDiceBear = ALLOWED_DICEBEAR.includes(profilePic);
    const isBase64 = typeof profilePic === "string" && profilePic.startsWith("data:image/");

    if (!isEmoji && !isDiceBear && !isBase64) {
      return res.status(400).json({ message: "Invalid profile picture" });
    }

    // Limit base64 to ~2 MB (≈ 2.7 MB base64 string)
    if (isBase64 && profilePic.length > 2_800_000) {
      return res.status(400).json({ message: "Image too large (max 2 MB)" });
    }

    await User.findByIdAndUpdate(req.userId, { profilePic });
    res.json({ profilePic });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("nickname email highestScore role xp cherries profilePic completedObjectives createdAt");

    const sessions = await GameSession.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("difficulty score puzzlesSolved puzzlesAttempted livesUsed duration xpEarned cherriesUsed createdAt");

    const totalGames = await GameSession.countDocuments({ user: req.userId });
    const totalScoreAgg = await GameSession.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: null, total: { $sum: "$score" } } }
    ]);

    const rankInfo = getRank(user.xp);

    // Build objectives list with progress
    const objectivesList = OBJECTIVES.map((obj) => ({
      ...obj,
      completed: (user.completedObjectives || []).includes(obj.id),
    }));

    // Build badge list (ranks achieved so far)
    const badges = RANKS.map((r, i) => ({
      ...r,
      achieved: user.xp >= r.xp,
      index: i,
    }));

    res.json({
      user: user.toObject(),
      sessions,
      totalGames,
      totalScore: totalScoreAgg[0]?.total || 0,
      rank: rankInfo,
      objectives: objectivesList,
      badges,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.leaderboard = async (req, res) => {
  try {
    const top = await User.find()
      .select("nickname highestScore xp profilePic")
      .sort({ highestScore: -1 })
      .limit(10);

    const result = top.map((u) => ({
      ...u.toObject(),
      rank: getRank(u.xp),
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.history = async (req, res) => {
  try {
    const sessions = await GameSession.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("difficulty score puzzlesSolved puzzlesAttempted livesUsed duration xpEarned cherriesUsed createdAt");
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};