const User = require("../models/User");
const GameSession = require("../models/GameSession");
const Attempt = require("../models/Attempt");

/* Admin-only middleware */
exports.adminOnly = (req, res, next) => {
    // req.userId already set by auth middleware
    User.findById(req.userId)
        .then((user) => {
            if (!user || user.role !== "admin") {
                return res.status(403).json({ message: "Admin access required" });
            }
            next();
        })
        .catch(() => res.status(500).json({ message: "Server error" }));
};

/* Dashboard stats */
exports.getDashboard = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalGames = await GameSession.countDocuments();

        const avgScoreAgg = await GameSession.aggregate([
            { $group: { _id: null, avg: { $avg: "$score" } } }
        ]);
        const avgScore = Math.round(avgScoreAgg[0]?.avg || 0);

        const topPlayer = await User.findOne()
            .sort({ highestScore: -1 })
            .select("nickname highestScore");

        const recentGames = await GameSession.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("user", "nickname email")
            .select("difficulty score puzzlesSolved duration createdAt");

        res.json({ totalUsers, totalGames, avgScore, topPlayer, recentGames });
    } catch (err) {
        console.error("❌ getDashboard error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
};

/* List all users */
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("nickname email highestScore role createdAt")
            .sort({ createdAt: -1 });

        // Attach game count to each user
        const usersWithStats = await Promise.all(
            users.map(async (u) => {
                const gamesPlayed = await GameSession.countDocuments({ user: u._id });
                return { ...u.toObject(), gamesPlayed };
            })
        );

        res.json(usersWithStats);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

/* Delete a user */
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Prevent self-delete
        if (userId === req.userId) {
            return res.status(400).json({ message: "Cannot delete yourself" });
        }

        await Attempt.deleteMany({ user: userId });
        await GameSession.deleteMany({ user: userId });
        await User.findByIdAndDelete(userId);

        res.json({ message: "User deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

/* Toggle user role */
exports.updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!["player", "admin"].includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const user = await User.findByIdAndUpdate(userId, { role }, { new: true })
            .select("nickname email role");

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
