import { useEffect, useState } from "react";
import { getHistory } from "../api/game";

export default function History() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    getHistory().then((res) => setRows(res.data)).catch(() => { });
  }, []);

  return (
    <div className="page-container" style={{ alignItems: "flex-start", paddingTop: 40 }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: 750 }}>
        <h2>📜 MY GAME HISTORY</h2>

        {rows.length === 0 ? (
          <p style={{ textAlign: "center" }}>No games played yet. Play your first match! 🍌</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Difficulty</th>
                  <th>Score</th>
                  <th>XP</th>
                  <th>Solved</th>
                  <th>🍒 Used</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s._id}>
                    <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span style={{
                        color: s.difficulty === "easy" ? "#7CFC00" :
                          s.difficulty === "medium" ? "#FFC107" : "#FF5722",
                        textTransform: "capitalize"
                      }}>{s.difficulty}</span>
                    </td>
                    <td style={{ color: "#FFD700" }}>{s.score}</td>
                    <td style={{ color: "#7CFC00" }}>+{s.xpEarned || 0}</td>
                    <td>{s.puzzlesSolved}/{s.puzzlesAttempted}</td>
                    <td>{s.cherriesUsed || 0}</td>
                    <td>{s.duration}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}