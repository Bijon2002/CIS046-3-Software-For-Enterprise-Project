import { useState, useContext } from "react";
import { loginUser } from "../api/auth";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const { setToken } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("Logging in...");
    try {
      const res = await loginUser(email, password);
      setToken(res.data.token);
      nav("/game");
    } catch (err) {
      setMsg(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="page-container">
      <div className="glass-card" style={{ minWidth: 340, maxWidth: 400 }}>
        <h2>🍌 LOGIN</h2>

        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <input
            placeholder="Email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Enter Jungle</button>
        </form>

        {msg && <p style={{ marginTop: 16, textAlign: "center" }}>{msg}</p>}

        <p style={{ marginTop: 20, textAlign: "center" }}>
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}