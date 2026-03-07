import React, { useState, useEffect, useRef } from "react";
import "../styles/LoadingScreen.css";
import gorillaImg from "../assets/gorilla.png";
import bananaImg from "../assets/banana.png";
import monkeyJumpSound from "../assets/monkey-jump.mp3";

export default function LoadingScreen({ onComplete }) {
  const [fadeOut, setFadeOut] = useState(false);
  const audioRef = useRef(null);

  // Play monkey jumping sound on mount
  useEffect(() => {
    const audio = new Audio(monkeyJumpSound);
    audio.volume = 0.5;
    audio.preload = "auto";
    audioRef.current = audio;

    const tryPlay = () => {
      if (!audioRef.current) return;
      // Resume AudioContext if suspended (browser autoplay policy)
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      ctx.close();

      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => { });
    };

    // Try playing immediately
    audio.play().catch(() => {
      // If blocked, wait for first user interaction then play
      const events = ["click", "touchstart", "keydown"];
      const handler = () => {
        tryPlay();
        events.forEach((e) => document.removeEventListener(e, handler));
      };
      events.forEach((e) => document.addEventListener(e, handler, { once: true }));
    });

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    // Start fade-out near the end of the animation
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
      // Fade out the sound smoothly
      if (audioRef.current) {
        const fadeAudio = setInterval(() => {
          if (audioRef.current && audioRef.current.volume > 0.05) {
            audioRef.current.volume = Math.max(0, audioRef.current.volume - 0.1);
          } else {
            clearInterval(fadeAudio);
            if (audioRef.current) audioRef.current.pause();
          }
        }, 50);
      }
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
