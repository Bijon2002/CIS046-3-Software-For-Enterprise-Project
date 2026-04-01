import { useEffect, useState, useContext } from "react";
import { getHistory, getMultiplayerHistory } from "../api/game";
import { AuthContext } from "../context/AuthContext";

const DICEBEAR_STYLES = ["adventurer", "pixel-art", "bottts", "lorelei", "fun-emoji", "croodles", "micah", "shapes"];

function PlayerAvatar({ pic, nickname }) {
    if (!pic || (!pic.startsWith("data:image/") && !DICEBEAR_STYLES.includes(pic))) {
        return <span style={{ fontSize: "2rem" }}>{pic || "🐒"}</span>;
    }
    const src = pic.startsWith("data:image/")
        ? pic
        : `https://api.dicebear.com/9.x/${pic}/svg?seed=${encodeURIComponent(nickname)}&radius=50`;
    return <img src={src} alt="avatar" style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid #FFD700" }} />;
}

export default function History() {
  const { user } = useContext(AuthContext);
  const [tab, setTab] = useState("solo"); // 'solo' or 'vs'
  const [rows, setRows] = useState([]);
  const [vsRows, setVsRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // Fetch Solo History independently
    getHistory()
        .then(res => setRows(res.data))
        .catch(err => console.error("Solo history fetch error:", err));

    // Fetch VS History independently
    getMultiplayerHistory()
        .then(res => {
            if (res.data) {
                setVsRows(res.data);
                // Smart tab choice: if we have NO solo but HAVE vs, switch to vs tab automatically
                // This will be checked again after rows are set if necessary
            }
        })
        .catch(err => console.error("VS history fetch error:", err))
        .finally(() => setLoading(false));

  }, []);

  // Additional effect to handle the "auto-switch" once both are loaded
  useEffect(() => {
    if (!loading && rows.length === 0 && vsRows.length > 0 && tab === "solo") {
        setTab("vs");
    }
  }, [loading, rows, vsRows]);

  return (
    <div className="page-container" style={{ alignItems: "flex-start", paddingTop: 40, paddingBottom: 40 }}>
      {/* Container */}
      <div className="glass-card" style={{ width: "100%", maxWidth: 800 }}>
        <h2 style={{ textAlign: "center", marginBottom: 20 }}>📜 BATTLE LOGS</h2>

        {/* Tab Selector */}
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <button 
                onClick={() => setTab("solo")}
                style={{ background: tab === "solo" ? "linear-gradient(90deg, #4CAF50, #2E7D32)" : "rgba(0,0,0,0.5)", border: tab === "solo" ? "2px solid #FFD700" : "1px solid rgba(255,255,255,0.2)", padding: "10px 20px", borderRadius: 8, color: "#FFF", cursor: "pointer", fontWeight: "bold" }}
            >🦍 SOLO MISSIONS
            </button>
            <button 
                onClick={() => setTab("vs")}
                style={{ background: tab === "vs" ? "linear-gradient(90deg, #E91E63, #9C27B0)" : "rgba(0,0,0,0.5)", border: tab === "vs" ? "2px solid #FFD700" : "1px solid rgba(255,255,255,0.2)", padding: "10px 20px", borderRadius: 8, color: "#FFF", cursor: "pointer", fontWeight: "bold" }}
            >⚔️ VS BATTLES
            </button>
        </div>

        {tab === "solo" && (
            rows.length === 0 ? (
            <p style={{ textAlign: "center" }}>No solo games played yet. Play your first match! 🍌</p>
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
            )
        )}

        {tab === "vs" && (
            !user ? (
                <p style={{ textAlign: "center", color: "#FFD700" }}>⏳ Syncing with Banana Servers...</p>
            ) : vsRows.length === 0 ? (
                <p style={{ textAlign: "center" }}>No VS Battles fought yet. Challenge someone in Multiplayer!</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {vsRows.map(match => {
                        const myId = user?._id || user?.id;
                        const isP1 = match.playerOne?._id === myId;
                        const isP2 = match.playerTwo?._id === myId;

                        // If user is neither P1 nor P2 (unlikely but safe), we don't know perspective
                        if (!isP1 && !isP2) return null;

                        const isWin = match.winner && match.winner._id === myId;
                        const isTie = !match.winner;
                        const borderColor = isWin ? "#7CFC00" : (isTie ? "#FFD700" : "#FF6B6B");
                        
                        const me = isP1 ? match.playerOne : match.playerTwo;
                        const them = isP1 ? match.playerTwo : match.playerOne;
                        const myScore = isP1 ? match.playerOneScore : match.playerTwoScore;
                        const themScore = isP1 ? match.playerTwoScore : match.playerOneScore;
                        
                        return (
                            <div key={match._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "rgba(0,0,0,0.4)", borderRadius: 12, borderLeft: `6px solid ${borderColor}`, boxShadow: "0 4px 10px rgba(0,0,0,0.3)", position: "relative", flexWrap: "wrap", animation: "cardFadeIn 0.3s ease-out" }}>
                                <div style={{ position: "absolute", top: 8, left: 16, fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", display: "flex", gap: 10, alignItems: "center" }}>
                                    <span>{new Date(match.createdAt).toLocaleDateString()}</span>
                                    <span style={{ background: "rgba(0,0,0,0.5)", padding: "2px 6px", borderRadius: 4 }}>{match.duration}s Match</span>
                                    <span style={{ color: borderColor, fontWeight: "bold", marginLeft: 10 }}>{isWin ? "🏆 WIN" : (isTie ? "🤝 TIE" : "💀 LOSS")}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, flex: 1, minWidth: 150 }}>
                                    <PlayerAvatar pic={me?.profilePic} nickname={me?.nickname} />
                                    <div style={{ textAlign: "left" }}>
                                        <div style={{ color: borderColor, fontWeight: "bold", fontSize: "0.9rem" }}>YOU</div>
                                        <div style={{ color: "#FFF", fontSize: "1.5rem", fontWeight: "bold" }}>{myScore} pt</div>
                                    </div>
                                </div>
                                <div style={{ color: "#FFF", fontSize: "1.2rem", fontWeight: "bold", opacity: 0.5, fontStyle: "italic", margin: "0 10px", marginTop: 16 }}>VS</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, flexDirection: "row-reverse", flex: 1, minWidth: 150 }}>
                                    <PlayerAvatar pic={them?.profilePic} nickname={them?.nickname} />
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ color: "#FF6B6B", fontWeight: "bold", fontSize: "0.9rem" }}>{them?.nickname || "Unknown"}</div>
                                        <div style={{ color: "#FFF", fontSize: "1.5rem", fontWeight: "bold" }}>{themScore} pt</div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )
        )}
      </div>
    </div>
  );
}