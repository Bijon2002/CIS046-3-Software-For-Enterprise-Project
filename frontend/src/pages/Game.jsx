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
    } catch { setMsg("Submission failed"); }
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
    <div className="game-layout">

      {/* ── Left Sidebar ── */}
      <aside className="game-sidebar">
        {/* Avatar circle */}
        <div className="sidebar-avatar-wrap">
          <PlayerAvatar pic={profilePic} nickname={nickname} />
          {rank?.current?.icon && <span className="sidebar-rank-badge">{rank.current.icon}</span>}
        </div>

        {/* Name + rank */}
        <div className="sidebar-nickname">{nickname}</div>
        {rank?.current && <div className="sidebar-rank-name">{rank.current.name}</div>}

        {/* XP bar */}
        <div className="sidebar-xp-label">⭐ {xp} XP</div>
        <div className="sidebar-xp-track">
          <div className="sidebar-xp-fill" style={{ width: `${xpProgress}%` }} />
        </div>
        {rank?.next && <div className="sidebar-xp-next">→ {rank.next.name} @ {rank.next.xp} XP</div>}

        <div className="sidebar-divider" />

        {/* Stats */}
        <div className="sidebar-stat"><span className="sidebar-stat-icon">🏆</span><span className="sidebar-stat-value">{highestScore}</span><span className="sidebar-stat-label">Best</span></div>
        <div className="sidebar-stat"><span className="sidebar-stat-icon">🍒</span><span className="sidebar-stat-value">{cherries}</span><span className="sidebar-stat-label">Cherries</span></div>
        <div className="sidebar-stat"><span className="sidebar-stat-icon">🎮</span><span className="sidebar-stat-value">{matchScore}</span><span className="sidebar-stat-label">Score</span></div>
      </aside>

      {/* ── Main game ── */}
      <div className="page-container" style={{ alignItems: "flex-start", paddingTop: 20, flex: 1, minWidth: 0 }}>
        <div className="glass-card" style={{ width: "100%", maxWidth: 720 }}>
          {/* Title row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h2 onClick={() => navigate("/home")} style={{ cursor: "pointer", margin: 0 }}>🍌 Banana Brain Quest</h2>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: "0.55rem", color: "#FF6B6B" }}>🍒 {cherries}</span>
              <span className={`difficulty-badge ${difficulty?.color}`}>{difficulty?.label}</span>
            </div>
          </div>

          {/* Score — Lives — Timer */}
          <div className="game-header">
            <h3 className="game-score">Score: {matchScore}</h3>
            <div className="lives-bar">
              {Array.from({ length: difficulty?.lives || 0 }).map((_, i) => (
                <span
                  key={i}
                  className={`life-icon ${i >= lives ? "lost" : ""} ${i === lostIndex ? "lost" : ""}`}
                  style={i >= lives && i !== lostIndex ? { opacity: 0, transform: "scale(0)" } : {}}
                >🧠</span>
              ))}
            </div>
            <div className={`game-timer ${timerClass()}`}>
              {difficulty?.timer ? `⏱ ${timeLeft}s` : "∞ Relax"}
            </div>
          </div>

          <button onClick={loadPuzzle} style={{ marginBottom: 16 }}>New Puzzle</button>

          {puzzle?.image && (
            <img src={`data:image/png;base64,${puzzle.image}`} alt="banana brain quest" className="puzzle-img" />
          )}

          <form onSubmit={handleSubmit} style={{ marginTop: 20, display: "flex", gap: 12 }}>
            <input
              placeholder="Enter missing digit (0-9)"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={isLocked}
              style={{ flex: 1 }}
            />
            <button type="submit" disabled={isLocked}>Submit</button>
          </form>

          {msg && <p className={`game-msg ${msgType}`}>{msg}</p>}
        </div>
      </div>
    </div>
  );
}