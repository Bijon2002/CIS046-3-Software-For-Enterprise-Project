import { useEffect, useState, useRef } from "react";
import { getPuzzle, submitAnswer, getMe } from "../api/game";

export default function Game() {
  const [puzzle, setPuzzle] = useState(null);
  const [answer, setAnswer] = useState("");
  const [msg, setMsg] = useState("");
  const [score, setScore] = useState(0);

  const [timeLeft, setTimeLeft] = useState(30);
  const [isLocked, setIsLocked] = useState(false);

  const ranOnce = useRef(false);

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

    getMe()
      .then((res) => setScore(res.data.score))
      .catch(() => {});

    loadPuzzle();
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

  // Handle timer reaching zero
  useEffect(() => {
    if (!puzzle) return;
    if (isLocked) return;

    if (timeLeft <= 0) {
      setIsLocked(true);
      setMsg("⏱️ Time's up! Loading next puzzle...");

      setTimeout(() => {
        loadPuzzle();
      }, 1200);
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
    <div style={{ padding: 40 }}>
      <h2>🍌 Banana Puzzle Game</h2>

      <h3>Score: {score}</h3>
      <h4>⏱️ Time Left: {timeLeft}s</h4>

      <button onClick={loadPuzzle}>New Puzzle</button>

      {puzzle?.image && (
        <div style={{ marginTop: 20 }}>
          <img
            src={`data:image/png;base64,${puzzle.image}`}
            alt="banana puzzle"
            style={{ maxWidth: 400 }}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
        <input
          placeholder="Enter missing digit (0-9)"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={isLocked}
        />

        <button type="submit" disabled={isLocked}>
          Submit Answer
        </button>
      </form>

      <p>{msg}</p>
    </div>
  );
}