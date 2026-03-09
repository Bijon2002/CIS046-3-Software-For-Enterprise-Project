import { useEffect, useRef, useState } from "react";
import { getProfile, updateProfilePic, buyCherry as buyCherryAPI } from "../api/game";
import "../styles/Profile.css";

/* ── DiceBear presets ── */
const DICEBEAR_STYLES = [
    "adventurer", "pixel-art", "bottts", "lorelei",
    "fun-emoji", "croodles", "micah", "shapes",
];
const dicebearUrl = (style, seed) =>
    `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed || "banana")}&radius=50`;

/* ── Helper: resize image with canvas → base64 (max 512px, ~80% JPEG) ── */
function resizeImage(file, maxPx = 512) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
                const w = Math.round(img.width * ratio);
                const h = Math.round(img.height * ratio);
                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                canvas.getContext("2d").drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL("image/jpeg", 0.8));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/* ── Avatar display: works for base64, DiceBear style name, or emoji ── */
function AvatarDisplay({ pic, nickname, size = "100%", style = {} }) {
    if (pic && pic.startsWith("data:image/")) {
        return <img src={pic} alt="avatar" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", ...style }} />;
    }
    if (pic && DICEBEAR_STYLES.includes(pic)) {
        return <img src={dicebearUrl(pic, nickname)} alt={pic} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", ...style }} />;
    }
    return <span style={style}>{pic || "🐒"}</span>;
}

export default function Profile() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPicSelector, setShowPicSelector] = useState(false);
    const [buyMsg, setBuyMsg] = useState("");
    const [uploadError, setUploadError] = useState("");
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const loadProfile = () => {
        getProfile()
            .then((res) => setData(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadProfile(); }, []);

    const handlePicChange = async (pic) => {
        try {
            await updateProfilePic(pic);
            setData((d) => ({ ...d, user: { ...d.user, profilePic: pic } }));
            setShowPicSelector(false);
            setUploadError("");
        } catch { /* */ }
    };

    /* ── Handle device image upload ── */
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setUploadError("Please select an image file.");
            return;
        }
        setUploading(true);
        setUploadError("");
        try {
            const base64 = await resizeImage(file, 512);
            await handlePicChange(base64);
        } catch {
            setUploadError("Failed to process image. Try a smaller file.");
        } finally {
            setUploading(false);
            // reset input so same file can be re-selected
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleBuyCherry = async () => {
        try {
            const res = await buyCherryAPI();
            setData((d) => ({
                ...d,
                user: { ...d.user, xp: res.data.xp, cherries: res.data.cherries },
                rank: res.data.rank,
            }));
            setBuyMsg("🍒 +1 Cherry!");
            setTimeout(() => setBuyMsg(""), 2000);
        } catch (err) {
            setBuyMsg(err?.response?.data?.message || "Failed");
            setTimeout(() => setBuyMsg(""), 2000);
        }
    };

    if (loading) return <div className="page-container"><p>Loading profile...</p></div>;
    if (!data) return <div className="page-container"><p>Failed to load profile</p></div>;

    const { user, sessions, totalGames, rank, objectives, badges } = data;
    const xpProgress = rank?.next
        ? ((user.xp - rank.current.xp) / (rank.next.xp - rank.current.xp)) * 100
        : 100;

    return (
        <div className="page-container" style={{ alignItems: "flex-start", paddingTop: 40 }}>
            <div className="profile-container">

                {/* Profile Header */}
                <div className="glass-card">
                    <div className="profile-header">
                        <div className="profile-avatar" onClick={() => setShowPicSelector((s) => !s)} title="Click to change avatar">
                            <AvatarDisplay pic={user.profilePic} nickname={user.nickname} />
                        </div>
                        <div className="profile-info">
                            <div className="profile-nickname">{user.nickname}</div>
                            <div className="profile-email">{user.email}</div>
                            <div className="profile-joined">
                                Joined {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {/* Avatar selector panel */}
                    {showPicSelector && (
                        <div className="avatar-selector-panel">

                            {/* ── Upload from device ── */}
                            <div className="avatar-section-label">📁 Upload from device</div>
                            <div className="avatar-upload-row">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    id="avatar-file-input"
                                    style={{ display: "none" }}
                                    onChange={handleFileUpload}
                                />
                                <label
                                    htmlFor="avatar-file-input"
                                    className={`avatar-upload-btn ${uploading ? "uploading" : ""}`}
                                >
                                    {uploading ? "⏳ Processing…" : "📷 Choose Image"}
                                </label>
                                {user.profilePic?.startsWith("data:image/") && (
                                    <div className="avatar-current-preview">
                                        <AvatarDisplay pic={user.profilePic} nickname={user.nickname} size={44} />
                                        <span style={{ fontSize: "0.38rem", color: "#7CFC00" }}>✅ Current</span>
                                    </div>
                                )}
                            </div>
                            {uploadError && (
                                <p style={{ fontSize: "0.38rem", color: "#FF5722", marginTop: 4, textAlign: "center" }}>{uploadError}</p>
                            )}

                            {/* ── DiceBear presets ── */}
                            <div className="avatar-section-label" style={{ marginTop: 14 }}>🎨 DiceBear Avatars</div>
                            <div className="dicebear-grid">
                                {DICEBEAR_STYLES.map((style) => (
                                    <div
                                        key={style}
                                        className={`dicebear-option ${style === user.profilePic ? "active" : ""}`}
                                        onClick={() => handlePicChange(style)}
                                        title={style}
                                    >
                                        <img
                                            src={dicebearUrl(style, user.nickname)}
                                            alt={style}
                                            style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }}
                                            loading="lazy"
                                        />
                                        <span style={{ fontSize: "0.35rem", color: "#cdb990", marginTop: 4, display: "block", textTransform: "capitalize" }}>{style}</span>
                                    </div>
                                ))}
                            </div>

                            {/* ── Emoji fallbacks ── */}
                            <div className="avatar-section-label" style={{ marginTop: 14 }}>😀 Classic Emojis</div>
                            <div className="pic-selector" style={{ marginTop: 0 }}>
                                {["🐒", "🦁", "🐯", "🦊", "🐼", "🐨", "🦜", "🐸"].map((a) => (
                                    <div
                                        key={a}
                                        className={`pic-option ${a === user.profilePic ? "active" : ""}`}
                                        onClick={() => handlePicChange(a)}
                                    >
                                        {a}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* XP & Rank */}
                <div className="glass-card xp-section">
                    <div className="xp-rank-row">
                        <span className="xp-rank-icon">{rank?.current?.icon}</span>
                        <div>
                            <div className="xp-rank-name">{rank?.current?.name}</div>
                            <div className="xp-rank-level">Level {(rank?.index || 0) + 1} / 10</div>
                        </div>
                    </div>
                    <div className="xp-bar-container">
                        <div className="xp-bar-fill" style={{ width: `${Math.min(xpProgress, 100)}%` }} />
                    </div>
                    <div className="xp-bar-text">
                        {user.xp} XP{rank?.next ? ` / ${rank.next.xp} XP to ${rank.next.name}` : " — MAX RANK!"}
                    </div>
                </div>

                {/* Stats */}
                <div className="profile-stats">
                    <div className="stat-card">
                        <div className="stat-value">🏆 {user.highestScore}</div>
                        <div className="stat-label">High Score</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">🎮 {totalGames}</div>
                        <div className="stat-label">Games</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">⭐ {user.xp}</div>
                        <div className="stat-label">Total XP</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">🍒 {user.cherries}</div>
                        <div className="stat-label">Cherries</div>
                    </div>
                </div>

                {/* Cherry Shop */}
                <div className="glass-card">
                    <h2>🍒 Cherry Shop</h2>
                    <div className="cherry-shop">
                        <div className="cherry-balance-big">
                            <span className="cherry-count">{user.cherries}</span>
                            <span className="cherry-label">Cherries</span>
                        </div>
                        <button
                            className="cherry-buy-btn"
                            onClick={handleBuyCherry}
                            disabled={user.xp < 50}
                        >
                            Buy 1 🍒 (50 XP)
                        </button>
                    </div>
                    {buyMsg && <p style={{ marginTop: 8, fontSize: "0.45rem", textAlign: "center", color: "#7CFC00" }}>{buyMsg}</p>}
                </div>

                {/* Rank Badges */}
                <div className="glass-card">
                    <h2>🎖️ Rank Badges</h2>
                    <div className="badges-grid">
                        {badges?.map((b) => (
                            <div key={b.index} className={`badge-item ${b.achieved ? "achieved" : ""}`}>
                                <div className="badge-icon">{b.icon}</div>
                                <div className="badge-name">{b.name}</div>
                                <div className="badge-xp">{b.xp} XP</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Objectives */}
                <div className="glass-card">
                    <h2>📋 Objectives</h2>
                    <div className="objectives-list">
                        {objectives?.map((obj) => (
                            <div key={obj.id} className={`objective-item ${obj.completed ? "completed" : ""}`}>
                                <span className="objective-check">{obj.completed ? "✅" : "⬜"}</span>
                                <div className="objective-info">
                                    <div className="objective-name">{obj.name}</div>
                                    <div className="objective-desc">{obj.desc}</div>
                                </div>
                                <div className="objective-reward">
                                    +{obj.xp} XP
                                    {obj.cherries > 0 && <span> +{obj.cherries}🍒</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Games */}
                <div className="glass-card">
                    <h2>📜 Recent Games</h2>
                    {sessions?.length === 0 ? (
                        <p style={{ textAlign: "center" }}>No games played yet 🍌</p>
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
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessions?.map((s) => (
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
                                            <td style={{ color: "#7CFC00" }}>+{s.xpEarned}</td>
                                            <td>{s.puzzlesSolved}/{s.puzzlesAttempted}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
