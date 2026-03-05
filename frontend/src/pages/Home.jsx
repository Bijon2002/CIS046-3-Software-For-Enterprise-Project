import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../components/LoadingScreen";
import { useMusic } from "../context/MusicContext";
import "../styles/Home.css";
import bananaImg from "../assets/banana.png";

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { musicOn, toggleMusic } = useMusic();
  const [showSettings, setShowSettings] = useState(false);
  const [sfxOn, setSfxOn] = useState(true);

  const handleLoadingComplete = useCallback(() => {
    setLoading(false);
  }, []);

  return (
    <>
      {/* Loading Screen */}
      {loading && <LoadingScreen onComplete={handleLoadingComplete} />}

      {/* Home Screen */}
      <div className="home-screen">
        {/* Floating particles */}
        <div className="home-particles">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="home-particle" />
          ))}
        </div>

        {/* Music toggle — top right */}
        <button
          className={`music-toggle ${!musicOn ? "music-off" : ""}`}
          onClick={toggleMusic}
          title={musicOn ? "Music On" : "Music Off"}
          id="music-toggle-btn"
        >
          {musicOn ? "🔊" : "🔇"}
        </button>

        {/* Main menu card */}
        <div className="home-menu-card">
          {/* Banana icon */}
          <img
            src={bananaImg}
            alt="Banana"
            className="home-banana-icon"
          />

          {/* Title */}
          <h1 className="home-title">
            BANANA<br />PUZZLE
          </h1>
          <p className="home-subtitle">🌿 Jungle Adventure 🌿</p>

          {/* Menu buttons */}
          <div className="home-buttons">
            <button
              className="home-btn btn-start"
              onClick={() => navigate("/game")}
              id="start-game-btn"
            >
              🎮 Start Game
            </button>

            <button
              className="home-btn btn-leaderboard"
              onClick={() => navigate("/leaderboard")}
              id="leaderboard-btn"
            >
              🏆 Leaderboards
            </button>

            <button
              className="home-btn btn-settings"
              onClick={() => setShowSettings(true)}
              id="settings-btn"
            >
              ⚙️ Settings
            </button>
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div
            className="settings-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowSettings(false);
            }}
          >
            <div className="settings-modal">
              <h2>⚙️ SETTINGS</h2>

              <div className="settings-option">
                <span className="settings-label">Music</span>
                <button
                  className={`toggle-switch ${musicOn ? "active" : ""}`}
                  onClick={toggleMusic}
                  id="settings-music-toggle"
                />
              </div>

              <div className="settings-option">
                <span className="settings-label">SFX</span>
                <button
                  className={`toggle-switch ${sfxOn ? "active" : ""}`}
                  onClick={() => setSfxOn((prev) => !prev)}
                  id="settings-sfx-toggle"
                />
              </div>

              <button
                className="settings-close-btn"
                onClick={() => setShowSettings(false)}
                id="settings-close-btn"
              >
                CLOSE
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}