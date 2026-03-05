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
    <div className="navbar">
      <Link to="/home" style={{ textDecoration: "none" }}><b>🍌 Banana Game</b></Link>

      {token && (
        <>
          <Link to="/game">Game</Link>
          <Link to="/history">History</Link>
          <Link to="/leaderboard">Leaderboard</Link>
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