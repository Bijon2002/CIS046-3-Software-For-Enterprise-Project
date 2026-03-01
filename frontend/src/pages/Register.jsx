import { useState } from "react";
import { registerUser } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("Creating account...");

    try {
      await registerUser(email, password);
      setMsg("Registered successfully ✅ Redirecting to login...");
      setTimeout(() => nav("/login"), 1000);
    } catch (err) {
      setMsg(err?.response?.data?.message || "Register failed");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>🍌 Banana Game Register</h2>

      <form onSubmit={submit} style={{ display: "grid", gap: 10, maxWidth: 300 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Password (min 6 chars)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button>Create Account</button>
      </form>

      <p>{msg}</p>

      <p>
        Already have account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}