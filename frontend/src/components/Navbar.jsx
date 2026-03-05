import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { token, logout } = useContext(AuthContext);
  const nav = useNavigate();

  const doLogout = () => {
    logout();
    nav("/login");
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 15,
        padding: 15,
        borderBottom: "1px solid #ddd",
        alignItems: "center"
      }}
    >
      <b>🍌 Banana Game</b>

      {token && (
        <>
          <Link to="/game">Game</Link>
          <Link to="/history">History</Link>
          <Link to="/leaderboard">Leaderboard</Link>
          <button onClick={doLogout} style={{ marginLeft: "auto" }}>
            Logout
          </button>
        </>
      )}

      {!token && (
        <div style={{ marginLeft: "auto" }}>
          <Link to="/login">Login</Link>{" "}
          <Link to="/register">Register</Link>
        </div>
      )}
    </div>
  );
}