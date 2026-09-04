import { useState, useEffect, useCallback, useRef } from "react";
import "./sound.scss";

const START_TIME = 24;
const MUSIC_DELAY_MS = 2000;
const AUDIO_ID = "wedding-audio";

function getAudio() {
  return document.getElementById(AUDIO_ID);
}

async function seekToStart(audio) {
  if (audio.readyState < 1) {
    await new Promise((resolve) => {
      audio.addEventListener("loadedmetadata", resolve, { once: true });
    });
  }
  if (audio.currentTime < START_TIME) {
    audio.currentTime = START_TIME;
  }
}

const Sound = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const userPausedRef = useRef(false);
  const scheduledRef = useRef(false);
  const delayTimerRef = useRef(null);
  const unlockingRef = useRef(false);

  const handlePlay = useCallback(async () => {
    const audio = getAudio();
    if (!audio) return;

    userPausedRef.current = false;
    audio.muted = false;

    try {
      await seekToStart(audio);
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.warn("Play failed:", err);
      setIsPlaying(false);
    }
  }, []);

  const handleStop = useCallback(() => {
    const audio = getAudio();
    if (!audio) return;

    userPausedRef.current = true;
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
    audio.pause();
    setIsPlaying(false);
  }, []);

  const unlockAudio = useCallback(async () => {
    const audio = getAudio();
    if (!audio) return;

    unlockingRef.current = true;
    audio.muted = true;
    try {
      await seekToStart(audio);
      await audio.play();
      audio.pause();
      audio.currentTime = START_TIME;
    } catch {
      // Autoplay policies vary; delayed play may still work after unlock attempt.
    } finally {
      unlockingRef.current = false;
    }
  }, []);

  const scheduleMusicAfterHeart = useCallback(() => {
    if (scheduledRef.current || userPausedRef.current) return;
    scheduledRef.current = true;

    void unlockAudio();

    delayTimerRef.current = setTimeout(() => {
      delayTimerRef.current = null;
      if (userPausedRef.current) return;
      handlePlay();
    }, MUSIC_DELAY_MS);
  }, [unlockAudio, handlePlay]);

  const toggleSound = useCallback(
    (event) => {
      event.stopPropagation();
      if (isPlaying || delayTimerRef.current) {
        handleStop();
      } else {
        handlePlay();
      }
    },
    [isPlaying, handlePlay, handleStop]
  );

  useEffect(() => {
    const audio = getAudio();
    if (!audio) return;

    const onPlay = () => {
      if (unlockingRef.current) return;
      setIsPlaying(true);
    };
    const onPause = () => {
      if (unlockingRef.current) return;
      setIsPlaying(false);
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    setIsPlaying(!audio.paused);

    window.addEventListener("intro:heart", scheduleMusicAfterHeart);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      window.removeEventListener("intro:heart", scheduleMusicAfterHeart);
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
      }
    };
  }, [scheduleMusicAfterHeart]);

  return (
    <div className="sound">
      <div className="sound-block">
        <button
          type="button"
          onClick={toggleSound}
          onTouchStart={(event) => event.stopPropagation()}
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
        </button>
      </div>
    </div>
  );
};

export default Sound;
