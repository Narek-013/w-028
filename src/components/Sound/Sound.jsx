import { useState, useRef, useEffect } from "react";
import "./sound.scss";
import { Imgs } from "../../img/imgs";

const Sound = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    handlePlay()
  }, []);

  const handlePlay = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = false;
      audio.currentTime = 50;
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn("Play failed:", err));
    }
  };

  const handleStop = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    }
  };
  

  return (
    <div className="sound container">
      <audio ref={audioRef} src="/audio-elegant.mp3" autoPlay muted={false} hidden />
      <div className="sound-block container">
        {isPlaying ? (
          <button onClick={handleStop}>
            <img src={Imgs.volumeUp} alt="volumeButoon" />
          </button>
        ) : (
          <button onClick={handlePlay}>
            <img src={Imgs.volumeDown} alt="volumeButoon" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Sound;
