import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { getMe } from "../api/game";

export default function Navbar() {
  const { token, logout } = useContext(AuthContext);
  const nav = useNavigate();
  const [role, setRole] = useState("player");

  useEffect(() => {
    if (token) {
      getMe()
        .then((res) => setRole(res.data.role || "player"))
        .catch(() => { });
    }
  }, [token]);

  const doLogout = () => {
    logout();
    nav("/login");
  };

  return (
    <div className="navbar">
      <Link to="/home" style={{ textDecoration: "none" }}><b>🍌 Banana Game</b></Link>

      {token && (
        <>
          <Link to="/game">Game</Link>
          <Link to="/profile">Profile</Link>
          <Link to="/history">History</Link>
          <Link to="/leaderboard">Leaderboard</Link>
          {role === "admin" && <Link to="/admin">Admin</Link>}
          <button onClick={doLogout}>Logout</button>
        </>
      )}

      {!token && (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </div>
  );
}