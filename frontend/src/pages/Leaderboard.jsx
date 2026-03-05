import { useEffect, useState } from "react";
import { getLeaderboard } from "../api/game";

export default function Leaderboard() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    getLeaderboard().then((res) => setRows(res.data)).catch(() => { });
  }, []);

  return (
    <div className="page-container" style={{ alignItems: "flex-start", paddingTop: 40 }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: 600 }}>
        <h2>🏆 LEADERBOARD</h2>

        {rows.length === 0 ? (
          <p style={{ textAlign: "center" }}>No scores yet. Be the first! 🍌</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u, i) => (
                  <tr key={u._id}>
                    <td style={{ color: i < 3 ? "#FFD700" : undefined }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </td>
                    <td>{u.email}</td>
                    <td style={{ color: "#7CFC00" }}>{u.score}</td>
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