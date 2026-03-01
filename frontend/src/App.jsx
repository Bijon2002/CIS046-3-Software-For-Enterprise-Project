import { useEffect, useState } from "react";

export default function App() {
  const [msg, setMsg] = useState("Loading...");

  useEffect(() => {
    fetch("/api/test")
      .then((r) => r.json())
      .then((d) => setMsg(d.message))
      .catch(() => setMsg("Backend not reachable ❌"));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>🍌 Banana Game</h1>
      <p>{msg}</p>
    </div>
  );
}