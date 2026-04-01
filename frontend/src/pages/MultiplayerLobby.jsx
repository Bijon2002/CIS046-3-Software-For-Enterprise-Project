import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../utils/socket";
import { AuthContext } from "../context/AuthContext";
import "../styles/app.css";

export default function MultiplayerLobby() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [mode, setMode] = useState(null); // 'create' or 'join'
    const [timerSetting, setTimerSetting] = useState(60);
    const [roomCodeInput, setRoomCodeInput] = useState("");
    const [createdRoomCode, setCreatedRoomCode] = useState(null);
    const [msg, setMsg] = useState("");
    const [waiting, setWaiting] = useState(false);

    // Player profile details
    const [myNickname, setMyNickname] = useState("Player");
    const [myAvatar, setMyAvatar] = useState("");

    // Connect socket and fetch profile when mounting
    useEffect(() => {
        socket.connect();

        // Fetch user profile using the game API (getMe returns nickname & profilePic)
        import("../api/game").then(({ getMe }) => {
            getMe().then(p => {
                setMyNickname(p.data.nickname || "Player");
                setMyAvatar(p.data.profilePic || "🐒");
            }).catch(e => console.error("Could not fetch profile", e));
        });

        // Listen for another player joining the room we created
        socket.on("gameReady", (data) => {
            // data: { players: [], timer: 60 }
            navigate(`/multiplayer/play/${createdRoomCode || roomCodeInput}`, { state: { roomData: data } });
        });

        return () => {
            socket.off("gameReady");
            // Don't disconnect socket here, because we want it alive in the game screen
        };
    }, [navigate, createdRoomCode, roomCodeInput]);

    const handleCreateRoom = () => {
        setMsg("Creating room...");
        const payload = {
            nickname: myNickname,
            avatar: myAvatar || "🐒",
            timerSetting,
            userId: user?._id || user?.id // Pass the real MongoDB ID
        };

        socket.emit("createRoom", payload, (response) => {
            if (response.success) {
                setCreatedRoomCode(response.roomCode);
                setWaiting(true);
                setMsg("");
            } else {
                setMsg("Failed to create room.");
            }
        });
    };

    const handleJoinRoom = () => {
        if (!roomCodeInput) return setMsg("Please enter a room code.");
        setMsg("Joining room...");

        const payload = {
            roomCode: roomCodeInput.toUpperCase(),
            nickname: myNickname,
            avatar: myAvatar || "🐒",
            userId: user?._id || user?.id
        };

        socket.emit("joinRoom", payload, (response) => {
            if (!response.success) {
                setMsg(response.message || "Failed to join room.");
            }
        });
    };

    return (
        <div className="page-container">
            <div className="glass-card" style={{ maxWidth: 500, width: "100%", textAlign: "center" }}>
                <h2>⚔️ MULTIPLAYER</h2>

                {/* Step 1: Choose mode (Create vs Join) */}
                {!mode && !waiting && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
                        <p style={{ color: "rgba(205,185,144,0.8)", fontSize: "0.85rem", marginBottom: 10 }}>Play head-to-head in real time!</p>
                        
                        {!user ? (
                            <p style={{ color: "#FFD700", fontSize: "0.8rem", animation: "pulse 1.5s infinite" }}>⏳ Syncing Account...</p>
                        ) : (
                            <>
                                <button className="home-btn" style={{ background: "linear-gradient(90deg, #4CAF50, #2E7D32)" }} onClick={() => setMode("create")}>
                                    ✨ Create Match
                                </button>
                                <button className="home-btn" style={{ background: "linear-gradient(90deg, #2196F3, #1565C0)" }} onClick={() => setMode("join")}>
                                    🔍 Join Match
                                </button>
                            </>
                        )}

                        <button className="home-btn" style={{ background: "rgba(255,255,255,0.1)", marginTop: 10 }} onClick={() => navigate("/")}>
                            BACK
                        </button>
                    </div>
                )}

                {/* Step 2a: Create Room */}
                {mode === "create" && !waiting && (
                    <div style={{ marginTop: 20, animation: "cardFadeIn 0.3s ease-out" }}>
                        <h3 style={{ color: "#FFD700", marginBottom: 16 }}>Create Match</h3>

                        <div style={{ marginBottom: 20 }}>
                            <p style={{ fontSize: "0.8rem", color: "rgba(205,185,144,0.8)", marginBottom: 10 }}>Time Limit (Seconds)</p>
                            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
                                {[30, 60, 120].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setTimerSetting(t)}
                                        style={{
                                            background: timerSetting === t ? "rgba(212,160,23,0.3)" : "rgba(0,0,0,0.3)",
                                            border: timerSetting === t ? "2px solid #FFD700" : "2px solid transparent",
                                            color: timerSetting === t ? "#FFD700" : "white",
                                            padding: "8px 16px",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                            fontFamily: "inherit"
                                        }}
                                    >
                                        {t}s
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button className="home-btn" style={{ background: "#4CAF50" }} onClick={handleCreateRoom}>
                            Create Room
                        </button>
                        <button className="home-btn" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", marginTop: 10 }} onClick={() => setMode(null)}>
                            Cancel
                        </button>
                    </div>
                )}

                {/* Step 2b: Join Room */}
                {mode === "join" && !waiting && (
                    <div style={{ marginTop: 20, animation: "cardFadeIn 0.3s ease-out" }}>
                        <h3 style={{ color: "#FFD700", marginBottom: 16 }}>Join Match</h3>

                        <input
                            type="text"
                            placeholder="ENTER 6-DIGIT CODE"
                            value={roomCodeInput}
                            onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                            style={{
                                background: "rgba(0,0,0,0.5)",
                                border: "2px solid rgba(212,160,23,0.4)",
                                color: "#FFD700",
                                padding: "16px",
                                fontSize: "1.2rem",
                                textAlign: "center",
                                borderRadius: "12px",
                                width: "80%",
                                fontFamily: "'Press Start 2P', monospace",
                                letterSpacing: 4,
                                marginBottom: 20
                            }}
                            maxLength={6}
                        />

                        <button className="home-btn" style={{ background: "#2196F3" }} onClick={handleJoinRoom}>
                            Join Room
                        </button>
                        <button className="home-btn" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", marginTop: 10 }} onClick={() => setMode(null)}>
                            Cancel
                        </button>
                    </div>
                )}

                {/* Step 3: Waiting in created room */}
                {waiting && (
                    <div style={{ marginTop: 20, animation: "cardFadeIn 0.3s ease-out" }}>
                        <h3 style={{ color: "#FFD700", marginBottom: 10 }}>Room Created!</h3>
                        <p style={{ fontSize: "0.8rem", color: "rgba(205,185,144,0.8)", marginBottom: 16 }}>Share this code with your friend:</p>

                        <div style={{
                            background: "rgba(0,0,0,0.6)",
                            padding: "20px",
                            borderRadius: "12px",
                            border: "2px dashed #FFD700",
                            marginBottom: 24,
                            display: "inline-block"
                        }}>
                            <span style={{ fontSize: "2.5rem", color: "#FFD700", letterSpacing: 8, fontFamily: "'Press Start 2P', monospace" }}>{createdRoomCode}</span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                            <span className="spinner" style={{ width: 16, height: 16, border: "2px solid #FFD700", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></span>
                            <p style={{ fontSize: "0.8rem", color: "rgba(205,185,144,0.8)" }}>Waiting for opponent to join...</p>
                        </div>

                        <button
                            className="home-btn"
                            style={{ background: "transparent", border: "1px solid rgba(255,107,107,0.5)", color: "#FF6B6B", marginTop: 24 }}
                            onClick={() => {
                                socket.disconnect(); // force disconnect to drop room
                                navigate("/");
                            }}
                        >
                            Cancel Match
                        </button>

                        <style>{`
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
                    </div>
                )}

                {msg && <p style={{ color: "#FF6B6B", marginTop: 16, fontSize: "0.8rem" }}>{msg}</p>}
            </div>
        </div>
    );
}
