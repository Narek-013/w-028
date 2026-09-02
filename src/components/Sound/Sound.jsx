import { useState, useEffect, useCallback } from "react";
import "./sound.scss";
import { Imgs } from "../../img/imgs";

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
          <img
            src={isPlaying ? Imgs.volumeUp : Imgs.volumeDown}
            alt={isPlaying ? "Music on" : "Music off"}
          />
        </button>
      </div>
    </div>
  );
};

export default Sound;
