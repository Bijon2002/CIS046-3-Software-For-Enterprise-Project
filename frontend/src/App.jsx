import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Game from "./pages/Game.jsx";
import History from "./pages/History.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import Profile from "./pages/Profile.jsx";
import Admin from "./pages/Admin.jsx";

/* Wrapper so we can conditionally hide Navbar on /home */
function AppContent() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/home" || location.pathname === "/";
  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        {/* Default — go to home */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Home / landing */}
        <Route path="/home" element={<Home />} />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/game"
          element={
            <ProtectedRoute>
              <Game />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* Public leaderboard */}
        <Route path="/leaderboard" element={<Leaderboard />} />

        {/* Fallback */}
        <Route path="*" element={<div style={{ padding: 40 }}>Not found</div>} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}