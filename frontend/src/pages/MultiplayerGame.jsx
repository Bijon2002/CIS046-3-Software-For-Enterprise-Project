import React, { useState, useEffect, useRef, useContext } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import socket from "../utils/socket";
import { AuthContext } from "../context/AuthContext";
import { getPuzzle, submitAnswer } from "../api/game";
import "../styles/app.css";
import "../styles/Game.css";

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

export default function MultiplayerGame() {
    const { roomCode } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    // Fallback if joined directly without socket state
    const initialRoomData = location.state?.roomData;

    const [players, setPlayers] = useState(initialRoomData?.players || []);
    const [timeLeft, setTimeLeft] = useState(initialRoomData?.timer || 60);
    const [puzzle, setPuzzle] = useState({ q: "Loading...", a: 0 });
    const [answer, setAnswer] = useState("");
    const [msg, setMsg] = useState("");
    const [phase, setPhase] = useState("playing"); // playing | gameover
    const [gameResult, setGameResult] = useState(null);

    const timerRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!socket.connected) {
            navigate("/multiplayer"); // Redirect to lobby if lost connection
            return;
        }

        // Everyone gets new puzzle when game starts
        loadPuzzle();

        // Listen for score updates from opponent
        socket.on("scoreUpdate", (updatedPlayers) => {
            setPlayers(updatedPlayers);
        });

        // Listen if opponent rage quits/disconnects
        socket.on("opponentLeft", ({ message }) => {
            clearInterval(timerRef.current);
            setMsg(message);
            setPhase("gameover");
            // Current player auto wins
            setGameResult("win");
        });

        // Local Timer
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(timerRef.current);
            socket.off("scoreUpdate");
            socket.off("opponentLeft");
        };
    }, []);

    const loadPuzzle = async () => {
        try {
            const p = await getPuzzle(); // Always use medium for multiplayer (API handles it)
            setPuzzle(p.data);
            setAnswer("");
            if (inputRef.current) inputRef.current.focus();
        } catch (err) {
            setMsg("Error loading puzzle");
        }
    };

    const handleTimeUp = () => {
        setPhase("gameover");
        setMsg("Time's up!");

        // We get the final scores
        setPlayers(currentPlayers => {
            const me = currentPlayers.find(p => p.id === socket.id);
            const opponent = currentPlayers.find(p => p.id !== socket.id);

            if (!opponent || !me) return currentPlayers;

            // Determine win/loss
            if (me.score > opponent.score) {
                setGameResult("win");
            } else if (me.score < opponent.score) {
                setGameResult("lose");
            } else {
                setGameResult("tie");
            }
            return currentPlayers;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!answer) return;

        if (parseInt(answer, 10) === puzzle?.a) {
            // Correct! Add points and tell server
            setMsg("Correct! +10");
            setPlayers(currentPlayers => {
                const updated = [...currentPlayers];
                const meIdx = updated.findIndex(p => p.id === socket.id);
                if (meIdx !== -1) {
                    updated[meIdx].score += 10;
                    socket.emit("updateScore", { roomCode, score: updated[meIdx].score });
                }
                return updated;
            });
            loadPuzzle();
        } else {
            setMsg("❌ Wrong Answer!");
            setAnswer("");
        }
    };

    if (players.length < 1) return <div className="page-container"><h2>Loading Room...</h2></div>;

    const me = players.find(p => p.id === socket.id);
    const opponent = players.find(p => p.id !== socket.id) || { nickname: "Waiting...", score: 0, avatar: "🐒" };

    return (
        <div className="page-container" style={{ paddingTop: 20 }}>
            {/* SCORES HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: 800, marginBottom: 20 }}>
                {/* Local Player Box */}
                <div style={{ background: "rgba(0,0,0,0.6)", border: "2px solid #FFD700", padding: "10px 20px", borderRadius: 12, display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                    <PlayerAvatar pic={me?.avatar} nickname={me?.nickname} />
                    <div>
                        <div style={{ color: "#FFD700", fontSize: "0.8rem" }}>{me?.nickname || "You"}</div>
                        <div style={{ color: "#7CFC00", fontSize: "1.5rem", fontWeight: "bold" }}>{me?.score || 0} pts</div>
                    </div>
                </div>

                {/* VS / Timer */}
                <div style={{ margin: "0 20px", textAlign: "center" }}>
                    <div style={{ color: "rgba(205,185,144,0.6)", fontSize: "0.8rem", marginBottom: 5 }}>ROOM: {roomCode}</div>
                    <div style={{ color: timeLeft <= 10 ? "#FF6B6B" : "#FFF", fontSize: "2rem", fontFamily: "'Press Start 2P', monospace", minWidth: 100 }}>
                        {timeLeft}s
                    </div>
                    <div style={{ color: "#FFD700", fontSize: "1.2rem", fontWeight: "bold", marginTop: 5 }}>VS</div>
                </div>

                {/* Opponent Box */}
                <div style={{ background: "rgba(0,0,0,0.6)", border: "2px solid #FF6B6B", padding: "10px 20px", borderRadius: 12, display: "flex", alignItems: "center", gap: 12, flex: 1, flexDirection: "row-reverse", textAlign: "right" }}>
                    <PlayerAvatar pic={opponent.avatar} nickname={opponent.nickname} />
                    <div>
                        <div style={{ color: "#FF6B6B", fontSize: "0.8rem" }}>{opponent.nickname}</div>
                        <div style={{ color: "#7CFC00", fontSize: "1.5rem", fontWeight: "bold" }}>{opponent.score || 0} pts</div>
                    </div>
                </div>
            </div>

            {/* GAME AREA */}
            <div className="glass-card" style={{ maxWidth: 600, width: "100%", textAlign: "center", opacity: phase === "gameover" ? 0.5 : 1 }}>
                <h2 style={{ fontSize: "2.5rem", margin: "30px 0", color: "#FFD700" }}>
                    {puzzle?.q} = ?
                </h2>

                <form onSubmit={handleSubmit}>
                    <input
                        ref={inputRef}
                        type="number"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        disabled={phase !== "playing"}
                        autoFocus
                        style={{
                            fontSize: "2rem",
                            width: "100%",
                            maxWidth: 300,
                            textAlign: "center",
                            padding: "16px",
                            marginBottom: 16,
                            background: "rgba(0,0,0,0.5)",
                            color: "#FFF",
                            border: "2px solid #FFD700",
                            borderRadius: "12px",
                            fontFamily: "'Press Start 2P', monospace"
                        }}
                    />
                </form>

                <div style={{ minHeight: "40px", color: msg.includes("❌") ? "#FF6B6B" : "#7CFC00", fontSize: "1rem" }}>
                    {msg}
                </div>
            </div>

            {/* GAME OVER MODAL */}
            {phase === "gameover" && (
                <div className="gameover-overlay">
                    <div className="gameover-card" style={{ animation: "cardFadeIn 0.5s ease-out" }}>
                        <h1 style={{
                            color: gameResult === "win" ? "#7CFC00" : (gameResult === "tie" ? "#FFD700" : "#FF6B6B"),
                            fontSize: "2.5rem",
                            marginBottom: 20
                        }}>
                            {gameResult === "win" ? "🏆 YOU WIN! 🏆" : (gameResult === "tie" ? "🤝 IT'S A TIE!" : "💀 YOU LOSE!")}
                        </h1>

                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 30, background: "rgba(0,0,0,0.3)", padding: 20, borderRadius: 12 }}>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ color: "#FFD700", fontSize: "0.8rem", marginBottom: 5 }}>YOU</div>
                                <div style={{ color: "#FFF", fontSize: "1.5rem" }}>{me?.score} pts</div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ color: "#FF6B6B", fontSize: "0.8rem", marginBottom: 5 }}>THEM</div>
                                <div style={{ color: "#FFF", fontSize: "1.5rem" }}>{opponent?.score} pts</div>
                            </div>
                        </div>

                        <button
                            className="gameover-btn"
                            onClick={() => {
                                socket.disconnect();
                                navigate("/multiplayer");
                            }}
                        >
                            Exit to Lobby
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
