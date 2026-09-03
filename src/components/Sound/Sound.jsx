import { useState, useEffect, useCallback } from "react";
import "./sound.scss";
const START_TIME = 50;
const AUDIO_ID = "wedding-audio";

function getAudio() {
  return document.getElementById(AUDIO_ID);
}

const Sound = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const syncPlayingState = useCallback(() => {
    const audio = getAudio();
    setIsPlaying(Boolean(audio && !audio.paused));
  }, []);

  const handlePlay = useCallback(() => {
    const audio = getAudio();
    if (!audio) return;

    audio.muted = false;
    if (audio.currentTime < START_TIME) {
      audio.currentTime = START_TIME;
    }

    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch((err) => console.warn("Play failed:", err));
  }, []);

  const handleStop = useCallback(() => {
    const audio = getAudio();
    if (!audio) return;

    audio.pause();
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    const audio = getAudio();
    if (!audio) return;

    audio.muted = false;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    syncPlayingState();

    if (audio.paused) {
      handlePlay();
    }

    const resumeOnInteraction = () => {
      const current = getAudio();
      if (!current || !current.paused) return;
      handlePlay();
    };

    document.addEventListener("click", resumeOnInteraction, { once: true });
    document.addEventListener("touchstart", resumeOnInteraction, { once: true });

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      document.removeEventListener("click", resumeOnInteraction);
      document.removeEventListener("touchstart", resumeOnInteraction);
    };
  }, [handlePlay, syncPlayingState]);

  return (
    <div className="sound">
      <div className="sound-block">
        <button
          type="button"
          onClick={isPlaying ? handleStop : handlePlay}
          aria-label={isPlaying ? "Turn music off" : "Turn music on"}
        >
          {isPlaying ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="sound__icon"
              aria-hidden="true"
            >
              <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="sound__icon"
              aria-hidden="true"
            >
              <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
              <line x1="22" x2="16" y1="9" y2="15" />
              <line x1="16" x2="22" y1="9" y2="15" />
            </svg>
          )}
        </button>      </div>
    </div>
  );
};

export default Sound;
