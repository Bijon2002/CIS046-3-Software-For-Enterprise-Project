import { useEffect, useState } from "react";
import { getLeaderboard } from "../api/game";

const DICEBEAR_STYLES = ["adventurer", "pixel-art", "bottts", "lorelei", "fun-emoji", "croodles", "micah", "shapes"];

function PlayerBadge({ pic, nickname }) {
  if (!pic || (!pic.startsWith("data:image/") && !DICEBEAR_STYLES.includes(pic))) {
    return <span style={{ fontSize: "1.3rem", marginRight: 8 }}>{pic || "🐒"}</span>;
  }
  const src = pic.startsWith("data:image/")
    ? pic
    : `https://api.dicebear.com/9.x/${pic}/svg?seed=${encodeURIComponent(nickname)}&radius=50`;
  return <img src={src} alt="avatar" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", marginRight: 8, verticalAlign: "middle", border: "1px solid rgba(212,160,23,0.3)" }} />;
}

export default function Leaderboard() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    getLeaderboard().then((res) => setRows(res.data)).catch(() => { });
  }, []);

  const medalColor = (i) => i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "rgba(205,185,144,0.5)";

  return (
    <div className="page-container" style={{ alignItems: "flex-start", paddingTop: 40 }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: 720 }}>
        <h2>🏆 LEADERBOARD</h2>

        {rows.length === 0 ? (
          <p style={{ textAlign: "center" }}>No scores yet. Be the first! 🍌</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Player</th>
                  <th>Rank</th>
                  <th>Best Score</th>
                  <th>XP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u, i) => (
                  <tr key={u._id} style={{ background: i === 0 ? "rgba(255,215,0,0.04)" : undefined }}>
                    <td style={{ color: medalColor(i), fontSize: "1.1rem", textAlign: "center" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <PlayerBadge pic={u.profilePic} nickname={u.nickname} />
                        <span style={{ color: "#FFD700" }}>{u.nickname}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.5rem", color: "#cdb990" }}>
                        {u.rank?.current?.icon} {u.rank?.current?.name}
                      </span>
                    </td>
                    <td style={{ color: "#7CFC00", fontWeight: "bold" }}>{u.highestScore}</td>
                    <td style={{ color: "#cdb990" }}>{u.xp} XP</td>
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