import { useState } from "react";
import { registerUser } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("Creating account...");

    try {
      await registerUser(nickname, email, password);
      setMsg("Registered ✅ Redirecting to login...");
      setTimeout(() => nav("/login"), 1000);
    } catch (err) {
      setMsg(err?.response?.data?.message || "Register failed");
    }
  };

  return (
    <div className="page-container">
      <div className="glass-card" style={{ minWidth: 340, maxWidth: 400 }}>
        <h2>🍌 REGISTER</h2>

        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <input
            placeholder="Nickname (shown in game)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <input
            placeholder="Email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Password (min 6 chars)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Create Account</button>
        </form>

        {msg && <p style={{ marginTop: 16, textAlign: "center" }}>{msg}</p>}

        <p style={{ marginTop: 20, textAlign: "center" }}>
          Already have account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}