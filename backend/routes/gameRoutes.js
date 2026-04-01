const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const {
    getPuzzle, submitAnswer, leaderboard, me, history,
    saveGameSession, getProfile,
    useCherry, buyCherry, updateProfilePic,
    saveMultiplayerMatch, getMultiplayerHistory
} = require("../controllers/gameController");

router.get("/puzzle", auth, getPuzzle);
router.post("/submit", auth, submitAnswer);
router.post("/session", auth, saveGameSession);
router.post("/multiplayer-result", auth, saveMultiplayerMatch);
router.get("/multiplayer-history", auth, getMultiplayerHistory);

router.get("/profile", auth, getProfile);
router.post("/use-cherry", auth, useCherry);
router.post("/buy-cherry", auth, buyCherry);
router.patch("/profile-pic", auth, updateProfilePic);
router.get("/leaderboard", leaderboard);
router.get("/me", auth, me);
router.get("/history", auth, history);

module.exports = router;