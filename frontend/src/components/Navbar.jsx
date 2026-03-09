import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { getMe } from "../api/game";

const DICEBEAR_STYLES = ["adventurer", "pixel-art", "bottts", "lorelei", "fun-emoji", "croodles", "micah", "shapes"];

function NavAvatar({ pic, nickname }) {
  if (!pic) return <span className="nav-avatar-emoji">🐒</span>;
  if (pic.startsWith("data:image/"))
    return <img src={pic} alt="avatar" className="nav-avatar-img" />;
  if (DICEBEAR_STYLES.includes(pic))
    return <img src={`https://api.dicebear.com/9.x/${pic}/svg?seed=${encodeURIComponent(nickname)}&radius=50`} alt={pic} className="nav-avatar-img" />;
  return <span className="nav-avatar-emoji">{pic}</span>;
}

export default function Navbar() {
  const { token, logout } = useContext(AuthContext);
  const nav = useNavigate();
  const [role, setRole] = useState("player");
  const [nickname, setNickname] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (token) {
      getMe()
        .then((res) => {
          setRole(res.data.role || "player");
          setNickname(res.data.nickname || "");
          setProfilePic(res.data.profilePic || null);
        })
        .catch(() => { });
    }
  }, [token]);

  /* Close dropdown when clicking outside */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const doLogout = () => {
    setOpen(false);
    logout();
    nav("/login");
  };

  return (
    <nav className="navbar">
      {/* ── Brand (left) ── */}
      <Link to="/home" className="navbar-brand">🍌 Banana Brain Quest</Link>

      {/* ── Nav links (right of brand, push to right via spacer) ── */}
      <div className="navbar-spacer" />

      {token && (
        <>
          <Link to="/game">Game</Link>
          <Link to="/history">History</Link>
          <Link to="/leaderboard">Leaderboard</Link>
          {role === "admin" && <Link to="/admin">Admin</Link>}

          {/* ── Avatar dropdown ── */}
          <div className="nav-profile-wrap" ref={dropdownRef}>
            <button
              className="nav-avatar-btn"
              onClick={() => setOpen((o) => !o)}
              title={nickname}
              aria-label="Profile menu"
            >
              <NavAvatar pic={profilePic} nickname={nickname} />
            </button>

            {open && (
              <div className="nav-dropdown">
                <div className="nav-dropdown-header">
                  <NavAvatar pic={profilePic} nickname={nickname} />
                  <span className="nav-dropdown-name">{nickname}</span>
                </div>
                <div className="nav-dropdown-divider" />
                <Link to="/profile" className="nav-dropdown-item" onClick={() => setOpen(false)}>
                  👤 Profile
                </Link>
                <button className="nav-dropdown-logout" onClick={doLogout}>
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {!token && (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
}