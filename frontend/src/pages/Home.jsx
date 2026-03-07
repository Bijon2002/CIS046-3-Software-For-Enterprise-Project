import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../components/LoadingScreen";
import { useMusic } from "../context/MusicContext";
import "../styles/Home.css";
import bananaImg from "../assets/banana.png";
import introVideo from "../assets/rec.mp4";

export default function Home() {
  const navigate = useNavigate();
  // Only show intro + loading on the first visit per session
  const alreadySeen = sessionStorage.getItem("introSeen");
  const [phase, setPhase] = useState(alreadySeen ? "ready" : "intro");
  const { musicOn, toggleMusic } = useMusic();
  const [showSettings, setShowSettings] = useState(false);
  const [sfxOn, setSfxOn] = useState(true);
  const [introFadeOut, setIntroFadeOut] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  // Skip or end intro video → go to loading screen
  const handleIntroEnd = useCallback(() => {
    if (phase !== "intro") return;
    setIntroFadeOut(true);
    setTimeout(() => {
      setPhase("loading");
    }, 500);
  }, [phase]);

  const handleLoadingComplete = useCallback(() => {
    sessionStorage.setItem("introSeen", "true");
    setPhase("ready");
  }, []);

  // Toggle mute/unmute on the intro video
  const handleToggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }, []);

  return (
    <>
      {/* Phase 1: Intro Video */}
      {phase === "intro" && (
        <div className={`intro-video-screen ${introFadeOut ? "fade-out" : ""}`}>
          <video
            ref={videoRef}
            className="intro-video"
            src={introVideo}
            autoPlay
            muted
            playsInline
            onEnded={handleIntroEnd}
          />
          <button
            className="video-mute-btn"
            onClick={handleToggleMute}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? "🔇" : "🔊"}
          </button>
          <button
            className="skip-intro-btn"
            onClick={handleIntroEnd}
            id="skip-intro-btn"
          >
            Skip Intro ⏭
          </button>
        </div>
      )}

      {/* Phase 2: Loading Screen */}
      {phase === "loading" && <LoadingScreen onComplete={handleLoadingComplete} />}

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
            BANANA<br />BRAIN QUEST
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