import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Game from "./pages/Game";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        { <Route path="/register" element={<Register />} /> }
        <Route path="/game" element={<Game />} />

        <Route path="*" element={<div style={{ padding: 40 }}>Not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}