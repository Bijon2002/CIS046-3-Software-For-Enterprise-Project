import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

const MusicContext = createContext(null);

// Free CC0 / royalty-free chiptune BGM URLs (loopable)
const BGM_URL = "https://cdn.pixabay.com/audio/2022/03/10/audio_4dedf5bf94.mp3"; // "Adventure" 8-bit chiptune

export function MusicProvider({ children }) {
    const audioRef = useRef(null);
    const [musicOn, setMusicOn] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    // Create audio element once
    useEffect(() => {
        const audio = new Audio(BGM_URL);
        audio.loop = true;
        audio.volume = 0.35;
        audio.preload = "auto";
        audioRef.current = audio;

        // Clean up on unmount
        return () => {
            audio.pause();
            audio.src = "";
        };
    }, []);

    // Handle play/pause based on musicOn state
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !hasInteracted) return;

        if (musicOn) {
            audio.play().then(() => setIsPlaying(true)).catch(() => { });
        } else {
            audio.pause();
            setIsPlaying(false);
        }
    }, [musicOn, hasInteracted]);

    // Listen for first user interaction to enable audio (browser autoplay policy)
    useEffect(() => {
        const handleInteraction = () => {
            setHasInteracted(true);
            if (musicOn && audioRef.current) {
                audioRef.current.play().then(() => setIsPlaying(true)).catch(() => { });
            }
        };

        window.addEventListener("click", handleInteraction, { once: true });
        window.addEventListener("keydown", handleInteraction, { once: true });

        return () => {
            window.removeEventListener("click", handleInteraction);
            window.removeEventListener("keydown", handleInteraction);
        };
    }, [musicOn]);

    const toggleMusic = useCallback(() => {
        setMusicOn((prev) => !prev);
    }, []);

    return (
        <MusicContext.Provider value={{ musicOn, toggleMusic, isPlaying }}>
            {children}
        </MusicContext.Provider>
    );
}

export function useMusic() {
    const ctx = useContext(MusicContext);
    if (!ctx) throw new Error("useMusic must be used within MusicProvider");
    return ctx;
}

export default MusicContext;
