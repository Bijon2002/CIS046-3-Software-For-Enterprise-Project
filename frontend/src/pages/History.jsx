import { useEffect, useState } from "react";
import { getHistory } from "../api/game";

export default function History() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    getHistory()
      .then((res) => setRows(res.data))
      .catch(() => { });
  }, []);

  return (
    <div className="page-container" style={{ alignItems: "flex-start", paddingTop: 40 }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: 720 }}>
        <h2>📜 MY ATTEMPTS</h2>

        {rows.length === 0 ? (
          <p style={{ textAlign: "center" }}>No attempts yet. Play a few puzzles first 🍌</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Your Answer</th>
                  <th>Correct</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a._id}>
                    <td>{new Date(a.createdAt).toLocaleString()}</td>
                    <td>{a.answer ?? "-"}</td>
                    <td>{a.correctAnswer}</td>
                    <td>{a.isCorrect ? "✅" : "❌"}</td>
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