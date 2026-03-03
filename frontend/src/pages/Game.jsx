import { useEffect, useState } from "react";
import { getPuzzle, submitAnswer } from "../api/game";
import { getMe } from "../api/game";

export default function Game() {
  const [puzzle, setPuzzle] = useState(null);
  const [answer, setAnswer] = useState("");
  const [msg, setMsg] = useState("");
  const [score, setScore] = useState(0);

  const loadPuzzle = async () => {
    setMsg("Loading new puzzle...");
    setAnswer("");
    try {
      const res = await getPuzzle();
      setPuzzle(res.data);
      setMsg("");
    } catch (err) {
      setMsg("Failed to load puzzle");
    }
  };

  useEffect(() => {
    loadPuzzle();
  }, []);

  
  useEffect(() => {
  getMe().then((res) => setScore(res.data.score)).catch(() => {});
  loadPuzzle();
}, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!puzzle) return;

    setMsg("Checking...");
    try {
      const res = await submitAnswer(puzzle.puzzleId, answer);
      setScore(res.data.score);

      if (res.data.isCorrect) {
        setMsg("✅ Correct! +10 points");
      } else {
        setMsg(`❌ Wrong. Correct answer: ${res.data.correctAnswer}`);
      }
    } catch {
      setMsg("Submission failed");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>🍌 Banana Puzzle Game</h2>
      <h3>Score: {score}</h3>

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
        />
        <button type="submit">Submit Answer</button>
      </form>

      <p>{msg}</p>
    </div>
  );
}