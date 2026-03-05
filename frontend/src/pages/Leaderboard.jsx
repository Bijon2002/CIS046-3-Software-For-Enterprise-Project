import { useEffect, useState } from "react";
import { getLeaderboard } from "../api/game";

export default function Leaderboard() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    getLeaderboard().then((res) => setRows(res.data)).catch(() => {});
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h2>🏆 Leaderboard</h2>
      <ol>
        {rows.map((u) => (
          <li key={u._id}>
            {u.email} — {u.score}
          </li>
        ))}
      </ol>
    </div>
  );
}