import { useEffect, useState, useRef, useCallback } from "react";
import { getPuzzle, submitAnswer, getMe, saveGameSession, useCherry as useCherryAPI } from "../api/game";
import { useNavigate } from "react-router-dom";
import "../styles/Game.css";

/* ---- Difficulty presets ---- */
const DIFFICULTY = {
  easy: { label: "Easy", icon: "🌿", timer: null, lives: 5, color: "easy" },
  medium: { label: "Medium", icon: "🔥", timer: 30, lives: 5, color: "medium" },
  hard: { label: "Hard", icon: "💀", timer: 10, lives: 3, color: "hard" },
};

/* ---- Cheering messages ---- */
const CHEERS = [
  (n) => `🔥 On fire, ${n}!`,
  (n) => `🎉 Nice one, ${n}!`,
  (n) => `💪 Go ${n}!`,
  (n) => `🌟 Brilliant, ${n}!`,
  (n) => `🚀 Unstoppable, ${n}!`,
  (n) => `🧠 Big brain, ${n}!`,
  (n) => `👏 Well done, ${n}!`,
  (n) => `⚡ Lightning fast, ${n}!`,
];
function getCheer(n) { return CHEERS[Math.floor(Math.random() * CHEERS.length)](n); }

/* ---- Buzzer sound ---- */
function playLifeLostSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
    setTimeout(() => ctx.close(), 500);
  } catch { /* */ }
}

/* ---- DiceBear styles ---- */
const DICEBEAR_STYLES = ["adventurer", "pixel-art", "bottts", "lorelei", "fun-emoji", "croodles", "micah", "shapes"];

/* ---- Avatar renderer (base64 / DiceBear / emoji) ---- */
function PlayerAvatar({ pic, nickname, cls = "sidebar-avatar-img", emojiCls = "sidebar-avatar-emoji" }) {
  if (!pic) return <span className={emojiCls}>🐒</span>;
  if (pic.startsWith("data:image/"))
    return <img src={pic} alt="avatar" className={cls} />;
  if (DICEBEAR_STYLES.includes(pic))
    return <img src={`https://api.dicebear.com/9.x/${pic}/svg?seed=${encodeURIComponent(nickname)}&radius=50`} alt={pic} className={cls} />;
  return <span className={emojiCls}>{pic}</span>;
}

export default function Game() {
  /* Phase */
  const [phase, setPhase] = useState("select");
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("bananaBrainIntro")) {
      setShowIntro(true);
    }
  }, []);

  const closeIntro = () => {
    localStorage.setItem("bananaBrainIntro", "true");
    setShowIntro(false);
  };
  const [diffKey, setDiffKey] = useState(null);
  const [difficulty, setDifficulty] = useState(null);

  /* Puzzle */
  const [puzzle, setPuzzle] = useState(null);
  const [answer, setAnswer] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");

  /* Per-match stats */
  const [matchScore, setMatchScore] = useState(0);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const [puzzlesAttempted, setPuzzlesAttempted] = useState(0);

  const [timeLeft, setTimeLeft] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lives, setLives] = useState(5);
  const [lostIndex, setLostIndex] = useState(null);

  /* User */
  const [nickname, setNickname] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [highestScore, setHighestScore] = useState(0);
  const [cherries, setCherries] = useState(0);
  const [xp, setXp] = useState(0);
  const [rank, setRank] = useState(null);

  /* Answer timing */
  const puzzleShownAt = useRef(null);
  const answerTimes = useRef([]);
  const [clutchAnswer, setClutchAnswer] = useState(false);

  /* Cherry continue */
  const [continueTimer, setContinueTimer] = useState(5);
  const [cherriesUsedThisGame, setCherriesUsedThisGame] = useState(0);

  /* Session results */
  const [sessionResult, setSessionResult] = useState(null);

  const gameStartTime = useRef(null);
  const ranOnce = useRef(false);
  const navigate = useNavigate();

  /* ---- Fetch user info ---- */
  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;
    getMe()
      .then((res) => {
        setNickname(res.data.nickname || "Player");
        setProfilePic(res.data.profilePic || null);
        setHighestScore(res.data.highestScore || 0);
        setCherries(res.data.cherries || 0);
        setXp(res.data.xp || 0);
        setRank(res.data.rank || null);
      })
      .catch(() => { });
  }, []);

  /* ---- Start game ---- */
  const startGame = useCallback((key) => {
    const cfg = DIFFICULTY[key];
    setDiffKey(key);
    setDifficulty(cfg);
    setLives(cfg.lives);
    setPhase("playing");
    setMatchScore(0);
    setPuzzlesSolved(0);
    setPuzzlesAttempted(0);
    setCherriesUsedThisGame(0);
    setClutchAnswer(false);
    setMsg("");
    setMsgType("");
    setLostIndex(null);
    setSessionResult(null);
    answerTimes.current = [];
    gameStartTime.current = Date.now();
  }, []);

  /* ---- Load puzzle ---- */
  const loadPuzzle = useCallback(async () => {
    setMsg("Loading puzzle…");
    setMsgType("");
    setAnswer("");
    if (difficulty?.timer) setTimeLeft(difficulty.timer);
    setIsLocked(false);
    try {
      const res = await getPuzzle();
      setPuzzle(res.data);
      puzzleShownAt.current = Date.now();
      setMsg("");
    } catch {
      setMsg("Failed to load puzzle");
    }
  }, [difficulty]);

  /* ---- Lose a life ---- */
  const loseLife = useCallback((message, type) => {
    setIsLocked(true);
    setMsg(message);
    setMsgType(type);
    playLifeLostSound();
    setLives((prev) => {
      const idx = prev - 1;
      setLostIndex(idx);
      const remaining = prev - 1;
      if (remaining <= 0) {
        setTimeout(() => setPhase("continue"), 800);
      } else {
        setTimeout(() => { setLostIndex(null); loadPuzzle(); }, 1200);
      }
      return remaining;
    });
  }, [loadPuzzle]);

  /* ---- Load puzzle on play ---- */
  useEffect(() => {
    if (phase === "playing" && difficulty) loadPuzzle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ---- Continue countdown ---- */
  useEffect(() => {
    if (phase !== "continue") return;
    setContinueTimer(5);
    const interval = setInterval(() => {
      setContinueTimer((t) => {
        if (t <= 1) { clearInterval(interval); setTimeout(() => setPhase("gameover"), 100); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  /* ---- Save session on game over ---- */
  useEffect(() => {
    if (phase !== "gameover" || !diffKey) return;
    const duration = gameStartTime.current ? Math.round((Date.now() - gameStartTime.current) / 1000) : 0;
    const times = answerTimes.current;
    const fastest = times.length ? Math.min(...times) : null;
    const slowest = times.length ? Math.max(...times) : null;
    saveGameSession({
      difficulty: diffKey, score: matchScore, puzzlesSolved, puzzlesAttempted,
      livesUsed: difficulty?.lives || 0, duration, fastestAnswer: fastest,
      slowestAnswer: slowest, cherriesUsed: cherriesUsedThisGame, clutchAnswer,
    })
      .then((res) => {
        setSessionResult(res.data);
        if (res.data.highestScore !== undefined) setHighestScore(res.data.highestScore);
        if (res.data.totalXP !== undefined) setXp(res.data.totalXP);
        if (res.data.cherries !== undefined) setCherries(res.data.cherries);
        if (res.data.rank) setRank(res.data.rank);
      })
      .catch(() => { });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ---- Use cherry ---- */
  const handleUseCherry = async () => {
    if (cherries <= 0) return;
    try {
      const res = await useCherryAPI();
      setCherries(res.data.cherries);
      setCherriesUsedThisGame((c) => c + 1);
      setLives(1);
      setLostIndex(null);
      setPhase("playing");
    } catch { setPhase("gameover"); }
  };

  /* ---- Timer countdown ---- */
  useEffect(() => {
    if (phase !== "playing" || !puzzle || isLocked || !difficulty?.timer) return;
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [puzzle, isLocked, phase, difficulty]);

  /* ---- Timeout ---- */
  useEffect(() => {
    if (phase !== "playing" || !puzzle || isLocked) return;
    if (timeLeft !== null && timeLeft <= 0) {
      setPuzzlesAttempted((p) => p + 1);
      loseLife("⏱️ Time's up!", "timeout");
    }
  }, [timeLeft, puzzle, isLocked, phase, loseLife]);

  /* ---- Submit answer ---- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!puzzle || isLocked) return;
    setIsLocked(true);
    setMsg("Checking…");
    setMsgType("");
    setPuzzlesAttempted((p) => p + 1);
    const ansTime = puzzleShownAt.current ? Date.now() - puzzleShownAt.current : null;
    if (ansTime) answerTimes.current.push(ansTime);
    if (difficulty?.timer && timeLeft !== null && timeLeft <= 2) setClutchAnswer(true);
    try {
      const res = await submitAnswer(puzzle.puzzleId, answer);
      if (res.data.isCorrect) {
        const points = 10;
        setMatchScore((s) => s + points);
        setPuzzlesSolved((s) => s + 1);
        setMsg(getCheer(nickname) + ` +${points} pts`);
        setMsgType("correct");
        setTimeout(() => loadPuzzle(), 1200);
      } else {
        loseLife(`❌ Wrong! Answer: ${res.data.correctAnswer}`, "wrong");
      }
    } catch { 
        setMsg("Submission failed"); 
        setTimeout(() => setIsLocked(false), 1500);
        setAnswer("");
    }
  };

  const timerClass = () => {
    if (!difficulty?.timer) return "no-timer";
    if (timeLeft > 15) return "safe";
    if (timeLeft > 5) return "warning";
    return "danger";
  };

  /* ===== XP progress for sidebar ===== */
  const xpProgress = rank?.next
    ? Math.min(((xp - (rank.current?.xp || 0)) / ((rank.next?.xp || 1) - (rank.current?.xp || 0))) * 100, 100)
    : 100;

  /* ===== RENDERS ===== */

  /* ---- SELECT ---- */
  if (phase === "select") {
    return (
      <div className="page-container">
        <div className="glass-card" style={{ maxWidth: 920, width: "100%" }}>
          <div className="difficulty-screen">
            <h2>🍌 Banana Brain Quest</h2>
            <p className="difficulty-subtitle">Choose Your Challenge</p>
            {nickname && (
              <p style={{ color: "#FFD700", fontSize: "0.85rem", marginBottom: 12 }}>
                Welcome, <strong>{nickname}</strong>! 🌟
                {highestScore > 0 && <span style={{ color: "#cdb990", fontSize: "0.65rem" }}>  |  Best: {highestScore} pts</span>}
              </p>
            )}
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24, flexWrap: "wrap", justifyContent: "center" }}>
              {rank && (
                <span style={{ fontSize: "0.75rem", color: "#cdb990", background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.25)", borderRadius: 10, padding: "6px 14px" }}>
                  {rank.current?.icon} {rank.current?.name}
                </span>
              )}
              <span style={{ fontSize: "0.75rem", color: "#FFD700", background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.25)", borderRadius: 10, padding: "6px 14px" }}>
                ⭐ {xp} XP
              </span>
              <span style={{ fontSize: "0.75rem", color: "#FF6B6B", background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.25)", borderRadius: 10, padding: "6px 14px" }}>
                🍒 {cherries}
              </span>
            </div>
            <div className="difficulty-options">
              {Object.entries(DIFFICULTY).map(([key, cfg]) => (
                <div key={key} className={`difficulty-card ${cfg.color}`} onClick={() => startGame(key)} id={`difficulty-${key}`}>
                  <span className="difficulty-icon">{cfg.icon}</span>
                  <span className="difficulty-label">{cfg.label}</span>
                  <span className="difficulty-info">
                    {cfg.timer ? `⏱ ${cfg.timer}s per puzzle` : "⏱ No timer"}<br />
                    🧠 {cfg.lives} lives
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---- CONTINUE ---- */
  if (phase === "continue") {
    return (
      <div className="cherry-overlay">
        <div className="cherry-card">
          <div className="cherry-icon">🍒</div>
          <div className="cherry-title">OUT OF BRAINS!</div>
          <p className="cherry-subtitle">Use a cherry to continue?</p>
          <div className="cherry-timer-ring"><span className="cherry-countdown">{continueTimer}</span></div>
          <div className="cherry-balance">You have <strong>{cherries}</strong> 🍒</div>
          {cherries > 0 ? (
            <button className="cherry-use-btn" onClick={handleUseCherry}>🍒 Use 1 Cherry — Continue!</button>
          ) : (
            <p style={{ color: "#FF5722", fontSize: "0.5rem" }}>No cherries! Earn more from objectives.</p>
          )}
          <button className="cherry-skip-btn" onClick={() => setPhase("gameover")}>Give Up</button>
        </div>
      </div>
    );
  }

  /* ---- GAME OVER ---- */
  if (phase === "gameover") {
    return (
      <div className="gameover-overlay">
        <div className="gameover-card">
          <div className="gameover-icon">💀</div>
          <div className="gameover-title">GAME OVER</div>
          {nickname && <p style={{ color: "#cdb990", fontSize: "0.55rem", marginBottom: 8 }}>Better luck next time, {nickname}!</p>}
          <p className="gameover-score-label">Match Score</p>
          <div className="gameover-score">{matchScore}</div>
          <p style={{ fontSize: "0.5rem", color: "#7CFC00", marginBottom: 4 }}>
            {puzzlesSolved} / {puzzlesAttempted} puzzles solved
          </p>
          {sessionResult && (
            <div className="gameover-rewards">
              <p style={{ fontSize: "0.5rem", color: "#FFD700", marginBottom: 4 }}>
                +{sessionResult.xpEarned} XP earned
                {sessionResult.objectiveXP > 0 && ` (+${sessionResult.objectiveXP} from objectives)`}
              </p>
              {sessionResult.newObjectives?.length > 0 && (
                <div className="gameover-objectives">
                  {sessionResult.newObjectives.map((o) => (
                    <div key={o.id} className="gameover-obj-badge">
                      🏆 {o.name}{o.cherries > 0 && <span> +{o.cherries}🍒</span>}
                    </div>
                  ))}
                </div>
              )}
              {matchScore >= highestScore && matchScore > 0 && (
                <p style={{ fontSize: "0.55rem", color: "#FFD700", marginTop: 8 }}>🏆 NEW HIGH SCORE!</p>
              )}
            </div>
          )}
          <button
            className="gameover-btn"
            onClick={() => { setPhase("select"); setDifficulty(null); setDiffKey(null); setPuzzle(null); setMsg(""); setMsgType(""); setLostIndex(null); setSessionResult(null); }}
            id="play-again-btn"
          >
            🎮 Play Again
          </button>
        </div>
      </div>
    );
  }

  /* ---- PLAYING ---- */
  return (
    <>
      {showIntro && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(10px)" }}>
          <div className="glass-card" style={{ maxWidth: 550, width: "90%", padding: "40px 30px", textAlign: "center", border: "2px solid #FFD700", animation: "cardFadeIn 0.3s ease-out", boxShadow: "0 20px 50px rgba(0,0,0,0.9)" }}>
            <h2 style={{ color: "#FFD700", fontSize: "2.4rem", marginBottom: 20, fontFamily: "'Press Start 2P', monospace", textShadow: "0 4px 10px rgba(0,0,0,0.8)" }}>🍌 HOW TO PLAY</h2>

            <div style={{ color: "#FFF", fontSize: "1.2rem", lineHeight: "1.6", textAlign: "left", marginBottom: 30, background: "rgba(0,0,0,0.4)", padding: "20px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p style={{ marginTop: 0 }}>Welcome to <b>Banana Brains</b>!</p>
              <ul style={{ paddingLeft: 20, margin: "15px 0" }}>
                <li style={{ marginBottom: 12 }}><b>Find the Pattern:</b> Look at the puzzle and figure out the missing digit (0-9).</li>
                <li style={{ marginBottom: 12 }}><b>Type & Submit:</b> Enter the number and click <b>🦍 GO BANANAS!</b></li>
                <li style={{ marginBottom: 12 }}><b>Race the Clock:</b> The faster you solve, the more points you get.</li>
                <li style={{ marginBottom: 12 }}><b>Survive:</b> Don't run out of brains 🧠 (lives)!</li>
                <li style={{ marginBottom: 0 }}><b>Level Up:</b> Earn XP to climb ranks and unlock new badges.</li>
              </ul>
              <p style={{ color: "#FFD700", textAlign: "center", fontWeight: "bold", fontSize: "1.3rem", marginTop: 20, marginBottom: 0 }}>Good luck, {nickname || "Player"}!</p>
            </div>

            <button onClick={closeIntro} style={{ background: "linear-gradient(90deg, #4CAF50, #2E7D32)", color: "#FFF", fontWeight: "bold", fontSize: "1.4rem", padding: "16px 40px", borderRadius: "16px", border: "none", cursor: "pointer", letterSpacing: 2, textTransform: "uppercase", boxShadow: "0 8px 25px rgba(76, 175, 80, 0.5)", transition: "transform 0.2s" }} onMouseOver={(e) => e.target.style.transform = "scale(1.05)"} onMouseOut={(e) => e.target.style.transform = "scale(1)"}>
              Let's Go!
            </button>
          </div>
        </div>
      )}

      <div className="page-container" style={{ minHeight: "calc(100vh - 80px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "10px" }}>

        {/* 🎮 THE UNIFIED GAME CONSOLE 🎮 */}
        <div className="glass-card game-console-wrapper" style={{ width: "100%", maxWidth: "1000px", padding: 0, display: "flex", flexDirection: "row", overflow: "hidden", borderRadius: "24px", boxShadow: "0 25px 60px rgba(0,0,0,0.8)", border: "2px solid rgba(255, 215, 0, 0.4)", background: "rgba(20, 20, 20, 0.4)" }}>

          {/* ── LEFT SIDE: Player Command Center ── */}
          <div style={{ width: "260px", background: "rgba(0,0,0,0.75)", display: "flex", flexDirection: "column", padding: "30px 20px", borderRight: "1px solid rgba(255,215,0,0.2)" }}>

            {/* Avatar & Name */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 30 }}>
              <div className="sidebar-avatar-wrap" style={{ transform: "scale(1.2)", marginBottom: 15 }}>
                <PlayerAvatar pic={profilePic} nickname={nickname} />
                {rank?.current?.icon && <span className="sidebar-rank-badge">{rank.current.icon}</span>}
              </div>
              <div style={{ color: "#FFD700", fontSize: "1.2rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, textAlign: "center" }}>{nickname}</div>
              {rank?.current && <div style={{ color: "#AAA", fontSize: "0.85rem", marginTop: 4 }}>{rank.current.name}</div>}

              {/* XP Track */}
              <div style={{ width: "100%", marginTop: 15 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#FFD700", marginBottom: 5 }}>
                  <span>⭐ {xp} XP</span>
                  {rank?.next && <span>{rank.next.name}</span>}
                </div>
                <div className="sidebar-xp-track" style={{ height: 6 }}>
                  <div className="sidebar-xp-fill" style={{ width: `${xpProgress}%`, background: "linear-gradient(90deg, #FFD700, #FFA500)" }} />
                </div>
              </div>
            </div>

            <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", marginBottom: 20 }}></div>

            {/* Quick Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "auto" }}>
              <div style={{ background: "rgba(0,0,0,0.4)", padding: "12px", borderRadius: 12, textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>🏆</div>
                <div style={{ fontSize: "1.2rem", color: "#FFF", fontWeight: "bold" }}>{highestScore}</div>
                <div style={{ fontSize: "0.7rem", color: "#AAA", textTransform: "uppercase" }}>Best</div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.4)", padding: "12px", borderRadius: 12, textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>🍒</div>
                <div style={{ fontSize: "1.2rem", color: "#FF6B6B", fontWeight: "bold" }}>{cherries}</div>
                <div style={{ fontSize: "0.7rem", color: "#AAA", textTransform: "uppercase" }}>Vault</div>
              </div>
            </div>

            <button onClick={loadPuzzle} style={{ marginTop: 20, width: "100%", background: "linear-gradient(90deg, #FF9800, #F44336)", fontSize: "1rem", fontWeight: "bold", padding: "14px", borderRadius: "12px", border: "none", cursor: "pointer", color: "#FFF", boxShadow: "0 4px 15px rgba(244, 67, 54, 0.4)", textTransform: "uppercase", letterSpacing: 1, transition: "transform 0.2s" }} onMouseOver={(e) => e.target.style.transform = "scale(1.05)"} onMouseOut={(e) => e.target.style.transform = "scale(1)"}>
              🔄 New Puzzle
            </button>
          </div>

          {/* ── RIGHT SIDE: The Live Game Arena ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>

            {/* Header Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 30px", background: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)", zIndex: 10 }}>

              <div>
                <h2 onClick={() => navigate("/home")} style={{ color: "#FFD700", margin: 0, textShadow: "0 4px 15px rgba(0,0,0,0.8)", fontSize: "1.8rem", cursor: "pointer", fontFamily: "'Press Start 2P', monospace" }}>🍌 Banana Brains</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                  <span className={`difficulty-badge ${difficulty?.color}`} style={{ fontSize: "0.75rem", padding: "4px 8px", margin: 0, letterSpacing: 1 }}>{difficulty?.label}</span>
                  <span style={{ color: "#7CFC00", fontWeight: "bold", fontSize: "1.1rem", textShadow: "0 2px 5px rgba(0,0,0,0.5)" }}>Score: {matchScore}</span>
                </div>
              </div>

              {/* Dynamic Timer Display */}
              <div className={`game-timer ${timerClass()}`} style={{ fontSize: "2.4rem", color: difficulty?.timer ? "#FFF" : "#FFD700", fontWeight: "900", fontFamily: "'Press Start 2P', monospace", textShadow: "0 4px 15px rgba(0,0,0,0.8)", background: "rgba(0,0,0,0.5)", padding: "10px 20px", borderRadius: 16, border: "2px solid rgba(255,255,255,0.1)" }}>
                {difficulty?.timer ? `${timeLeft}s` : "∞"}
              </div>
            </div>

            {/* Center Puzzle Display */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 20px" }}>
              {puzzle?.image ? (
                <img src={puzzle.image.startsWith("http") ? puzzle.image : `data:image/png;base64,${puzzle.image}`} alt="puzzle" style={{ maxHeight: "40vh", objectFit: "contain", filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.5))", transform: "scale(1.05)" }} />
              ) : (
                <div style={{ color: "#FFF", fontSize: "1.5rem" }}>Loading Next Puzzle...</div>
              )}
            </div>

            {/* Feedback Messsage */}
            <div style={{ position: "absolute", bottom: "110px", width: "100%", textAlign: "center", pointerEvents: "none" }}>
              {msg && <span className={`game-msg ${msgType}`} style={{ display: "inline-block", background: "rgba(0,0,0,0.8)", padding: "8px 20px", borderRadius: 20 }}>{msg}</span>}
            </div>

            {/* Bottom Action Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 30px", background: "rgba(0,0,0,0.6)", borderTop: "1px solid rgba(255,215,0,0.1)", backdropFilter: "blur(10px)" }}>

              {/* Lives Display */}
              <div className="lives-bar" style={{ gap: 8, margin: 0 }}>
                {Array.from({ length: difficulty?.lives || 0 }).map((_, i) => (
                  <span key={i} className={`life-icon ${i >= lives ? "lost" : ""} ${i === lostIndex ? "lost" : ""}`} style={i >= lives && i !== lostIndex ? { opacity: 0, transform: "scale(0)" } : { fontSize: "1.8rem", filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.5))" }}>🧠</span>
                ))}
              </div>

              {/* Interactive Input Form */}
              <form onSubmit={handleSubmit} style={{ display: "flex", gap: 15 }}>
                <input
                  placeholder="Insert 1 Digit"
                  type="number"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={isLocked}
                  autoFocus
                  style={{ background: "rgba(0,0,0,0.5)", border: "2px solid #FFD700", color: "#FFF", fontSize: "1.4rem", padding: "10px 20px", borderRadius: "12px", width: "160px", textAlign: "center", fontFamily: "'Press Start 2P', monospace", boxShadow: "inset 0 2px 10px rgba(0,0,0,0.5)" }}
                />
                <button type="submit" disabled={isLocked} style={{ background: "linear-gradient(90deg, #9C27B0, #E91E63)", color: "#FFF", fontWeight: "bold", fontSize: "1.1rem", padding: "0 30px", borderRadius: "12px", border: "none", cursor: isLocked ? "not-allowed" : "pointer", letterSpacing: 1, textTransform: "uppercase", boxShadow: "0 4px 15px rgba(233, 30, 99, 0.4)", flexShrink: 0 }}>
                  🦍 GO BANANAS!
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}