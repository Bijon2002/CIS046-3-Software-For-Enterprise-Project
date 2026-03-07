import { useEffect, useState, useRef } from "react";
import { getPuzzle, submitAnswer, getMe } from "../api/game";
import { useNavigate } from "react-router-dom";

export default function Game() {
  const [puzzle, setPuzzle] = useState(null);
  const [answer, setAnswer] = useState("");
  const [msg, setMsg] = useState("");
  const [score, setScore] = useState(0);

  const [timeLeft, setTimeLeft] = useState(30);
  const [isLocked, setIsLocked] = useState(false);

  const ranOnce = useRef(false);
  const navigate = useNavigate();

  // Load new puzzle
  const loadPuzzle = async () => {
    setMsg("Loading puzzle...");
    setAnswer("");
    setTimeLeft(30);
    setIsLocked(false);

    try {
      const res = await getPuzzle();
      setPuzzle(res.data);
      setMsg("");
    } catch {
      setMsg("Failed to load puzzle");
    }
  };

  // Run once on page load
  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    const initializeGame = async () => {
      await getMe()
        .then((res) => setScore(res.data.score))
        .catch(() => { });

      await loadPuzzle();
    };
    initializeGame();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!puzzle) return;
    if (isLocked) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [puzzle, isLocked]);

  // When timer reaches 0
  useEffect(() => {
    if (!puzzle || isLocked) return;

    if (timeLeft <= 0) {
      setIsLocked(true);
      setMsg("⏱️ Time's up! Loading next puzzle...");

      const timeout = setTimeout(() => {
        loadPuzzle();
      }, 1200);

      return () => clearTimeout(timeout);
    }
  }, [timeLeft, puzzle, isLocked]);

  // Submit answer
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!puzzle || isLocked) return;

    setIsLocked(true);
    setMsg("Checking answer...");

    try {
      const res = await submitAnswer(puzzle.puzzleId, answer);
      setScore(res.data.score);

      if (res.data.isCorrect) {
        setMsg("✅ Correct! +10 points");
      } else {
        setMsg(`❌ Wrong! Correct answer: ${res.data.correctAnswer}`);
      }

      setTimeout(() => loadPuzzle(), 1500);
    } catch {
      setMsg("Submission failed");
    }
  };

  return (
    <div className="page-container" style={{ alignItems: "flex-start", paddingTop: 20 }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: 720 }}>
        <h2
          onClick={() => navigate("/home")}
          style={{ cursor: "pointer" }}
        >
          🍌 Banana Brain Quest
        </h2>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3>Score: {score}</h3>
          <p className="timer">⏱ {timeLeft}s</p>
        </div>

        <button onClick={loadPuzzle} style={{ marginBottom: 16 }}>
          New Puzzle
        </button>

        {puzzle?.image && (
          <img
            src={`data:image/png;base64,${puzzle.image}`}
            alt="banana brain quest"
            className="puzzle-img"
          />
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: 20, display: "flex", gap: 12 }}>
          <input
            placeholder="Enter missing digit (0-9)"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isLocked}
            style={{ flex: 1 }}
          />
          <button type="submit" disabled={isLocked}>
            Submit
          </button>
        </form>

        {msg && <p style={{ marginTop: 16, textAlign: "center" }}>{msg}</p>}
      </div>
    </div>
  );
}