import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Game from "./pages/Game";
import Leaderboard from "./pages/Leaderboard";
import ProtectedRoute from "./components/ProtectedRoute";
import History from "./pages/History";
// import ProtectedRoute from "./components/ProtectedRoute";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        { <Route path="/register" element={<Register />} /> }
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

<Route path="/leaderboard" element={<Leaderboard />} />

        <Route path="*" element={<div style={{ padding: 40 }}>Not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

{/* <Route
  path="/history"
  element={
    <ProtectedRoute>
      <History />
    </ProtectedRoute>
  }
/> */}