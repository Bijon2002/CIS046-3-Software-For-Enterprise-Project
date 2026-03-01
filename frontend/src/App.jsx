import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";// 

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        { <Route path="/register" element={<Register />} /> }

        {/* TEMP placeholder so nav("/game") doesn't break */}
        <Route path="/game" element={<div style={{ padding: 40 }}>Game page coming… 🍌</div>} />

        <Route path="*" element={<div style={{ padding: 40 }}>Not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}