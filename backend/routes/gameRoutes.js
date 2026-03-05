const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { getPuzzle, submitAnswer, leaderboard, me, history } = require("../controllers/gameController");

router.get("/puzzle", auth, getPuzzle);
router.post("/submit", auth, submitAnswer);
router.get("/leaderboard", leaderboard);
router.get("/me", auth, me);
router.get("/history", auth, history);

module.exports = router;