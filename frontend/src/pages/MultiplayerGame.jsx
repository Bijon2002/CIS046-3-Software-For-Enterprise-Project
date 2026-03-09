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
    const [puzzle, setPuzzle] = useState(null);
    const [answer, setAnswer] = useState("");
    const [msg, setMsg] = useState("Loading...");
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
            setMsg("Loading...");
            const p = await getPuzzle(); // Always use medium for multiplayer (API handles it)
            setPuzzle(p.data);
            setMsg("");
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!answer || !puzzle) return;

        setMsg("Checking...");
        try {
            const res = await submitAnswer(puzzle.puzzleId, answer);

            if (res.data.isCorrect) {
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
                // Wait briefly then load next
                setTimeout(loadPuzzle, 800);
            } else {
                setMsg(`❌ Wrong! The correct answer was ${res.data.correctAnswer}`);
                setAnswer("");
            }
        } catch (err) {
            setMsg("Submission failed");
        }
    };

    if (players.length < 1) return <div className="page-container"><h2>Loading Room...</h2></div>;

    const me = players.find(p => p.id === socket.id);
    const opponent = players.find(p => p.id !== socket.id) || { nickname: "Waiting...", score: 0, avatar: "🐒" };

    return (
        <div className="page-container" style={{ minHeight: "calc(100vh - 80px)", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 10, paddingBottom: 10, gap: 16 }}>

            {/* CENTER TITLE */}
            <div style={{ width: "100%", textAlign: "center", marginBottom: 10 }}>
                <h2 style={{ margin: "0", fontSize: "2.4rem", color: "#FFD700", textShadow: "0 4px 15px rgba(0,0,0,0.6)", fontFamily: "'Press Start 2P', monospace" }}>🍌 Banana Brain Quest</h2>
            </div>

            {/* 1. TOP VS DASHBOARD RIBBON */}
            <div className="glass-card" style={{ width: "100%", maxWidth: 1000, padding: "16px 30px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, position: "relative", overflow: "hidden" }}>

                {/* BG Glow Effect */}
                <div style={{ position: "absolute", top: 0, left: "-50%", width: "200%", height: "100%", background: "linear-gradient(90deg, rgba(255,215,0,0.05) 0%, rgba(255,107,107,0.05) 100%)", pointerEvents: "none" }}></div>

                {/* Local Player left side */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, zIndex: 1, flex: 1, minWidth: 200 }}>
                    <PlayerAvatar pic={me?.avatar} nickname={me?.nickname} />
                    <div style={{ textAlign: "left" }}>
                        <div style={{ color: "#FFD700", fontSize: "1rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1 }}>{me?.nickname || "You"}</div>
                        <div style={{ color: "#7CFC00", fontSize: "2rem", fontWeight: "900", textShadow: "0 2px 10px rgba(124, 252, 0, 0.4)" }}>{me?.score || 0} pts</div>
                    </div>
                </div>

                {/* Center Control / VS / Timer */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, zIndex: 1 }}>
                    <div style={{ color: "#FFF", fontSize: "0.8rem", fontWeight: "bold", background: "rgba(0,0,0,0.5)", padding: "6px 16px", borderRadius: 20, letterSpacing: 2, border: "1px solid rgba(255,255,255,0.1)" }}>ROOM: {roomCode}</div>

                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                        <div style={{ height: "2px", width: "40px", background: "linear-gradient(90deg, transparent, #FFD700)" }}></div>
                        <div style={{ color: "#FFD700", fontSize: "2.5rem", fontWeight: "900", fontStyle: "italic", textShadow: "0 4px 15px rgba(255, 215, 0, 0.5)" }}>VS</div>
                        <div style={{ height: "2px", width: "40px", background: "linear-gradient(270deg, transparent, #FFD700)" }}></div>
                    </div>

                    <div style={{ color: timeLeft <= 10 ? "#FF6B6B" : "#FFF", fontSize: "2rem", fontFamily: "'Press Start 2P', monospace", background: "rgba(0,0,0,0.6)", padding: "10px 20px", borderRadius: 12, border: timeLeft <= 10 ? "2px solid #FF6B6B" : "2px solid rgba(255,255,255,0.2)", boxShadow: timeLeft <= 10 ? "0 0 20px rgba(255,107,107,0.4)" : "none" }}>
                        ⏱ {timeLeft}s
                    </div>
                </div>

                {/* Opponent Box right side */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexDirection: "row-reverse", textAlign: "right", zIndex: 1, flex: 1, minWidth: 200 }}>
                    <PlayerAvatar pic={opponent?.avatar} nickname={opponent?.nickname} />
                    <div>
                        <div style={{ color: "#FF6B6B", fontSize: "1rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1 }}>{opponent?.nickname}</div>
                        <div style={{ color: "#7CFC00", fontSize: "2rem", fontWeight: "900", textShadow: "0 2px 10px rgba(124, 252, 0, 0.4)" }}>{opponent?.score || 0} pts</div>
                    </div>
                </div>
            </div>

            {/* MAIN GAME INTERFACE */}
            <div className="glass-card" style={{ maxWidth: 800, width: "100%", textAlign: "center", opacity: phase === "gameover" ? 0.5 : 1, position: "relative", zIndex: 5, padding: "24px 20px" }}>

                {puzzle?.image && (
                    <img src={`data:image/png;base64,${puzzle.image}`} alt="banana brain quest" className="puzzle-img" style={{ margin: "10px auto", display: "block", maxHeight: "35vh", objectFit: "contain" }} />
                )}

                <form onSubmit={handleSubmit} style={{ marginTop: 10, display: "flex", gap: 12, width: "100%", maxWidth: 500, margin: "0 auto" }}>
                    <input
                        ref={inputRef}
                        type="number"
                        placeholder="Digit (0-9)"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        disabled={phase !== "playing"}
                        autoFocus
                        style={{
                            fontSize: "1.5rem",
                            flex: 1,
                            textAlign: "center",
                            background: "rgba(0,0,0,0.5)",
                            color: "#FFF",
                            border: "2px solid #FFD700",
                            borderRadius: "12px",
                            fontFamily: "'Press Start 2P', monospace"
                        }}
                    />
                    <button type="submit" disabled={phase !== "playing"} style={{ background: "linear-gradient(90deg, #9C27B0, #E91E63)", fontWeight: "bold", letterSpacing: 1, padding: "0 24px", fontSize: "1.1rem" }}>🦍 GO BANANAS!</button>
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
