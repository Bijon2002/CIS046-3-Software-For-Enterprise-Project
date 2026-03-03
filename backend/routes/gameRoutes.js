const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { getPuzzle, submitAnswer, leaderboard } = require("../controllers/gameController");
const { getPuzzle, submitAnswer, leaderboard, me } = require("../controllers/gameController");

router.get("/puzzle", auth, getPuzzle);
router.post("/submit", auth, submitAnswer);
router.get("/leaderboard", leaderboard);
router.get("/me", auth, me);

module.exports = router;