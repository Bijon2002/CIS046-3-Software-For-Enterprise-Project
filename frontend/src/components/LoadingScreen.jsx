import React, { useState, useEffect } from "react";
import "../styles/LoadingScreen.css";
import gorillaImg from "../assets/gorilla.png";
import bananaImg from "../assets/banana.png";

export default function LoadingScreen({ onComplete }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade-out near the end of the animation
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2800);

    // Fully complete after fade-out transition
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3400);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`loading-screen ${fadeOut ? "fade-out" : ""}`}>
      {/* Floating particles */}
      <div className="loading-particles">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="loading-particle" />
        ))}
      </div>

      {/* Gorilla running towards banana */}
      <div className="loading-runway">
        <img
          src={gorillaImg}
          alt="Gorilla running"
          className="loading-gorilla"
        />
        <img
          src={bananaImg}
          alt="Banana"
          className="loading-banana"
        />
      </div>

      {/* Loading text */}
      <p className="loading-text">LOADING...</p>

      {/* Progress bar */}
      <div className="loading-progress-container">
        <div className="loading-progress-bar" />
      </div>
    </div>
  );
}
