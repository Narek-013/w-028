import { useCallback, useEffect, useRef, useState } from "react";
import "./Intro.scss";

const POSTER_SRC = "/intro-poster.webp";
const VIDEO_SRC = "/heart.mp4";
const FADE_DURATION_MS = 1200;
const FADE_BEFORE_END_SEC = 0.9;

const Intro = ({ onFadeStart, onComplete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaVisible, setMediaVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const videoRef = useRef(null);
  const exitStartedRef = useRef(false);
  const completeCalledRef = useRef(false);

  const finishIntro = useCallback(() => {
    if (completeCalledRef.current) return;
    completeCalledRef.current = true;
    onComplete?.();
  }, [onComplete]);

  const startExit = useCallback(() => {
    if (exitStartedRef.current) return;
    exitStartedRef.current = true;
    setExiting(true);
    onFadeStart?.();
  }, [onFadeStart]);

  useEffect(() => {
    videoRef.current?.load();
  }, []);

  const handleStart = async () => {
    const video = videoRef.current;
    if (!video || isPlaying || exiting) return;

    setIsPlaying(true);

    const revealVideo = () => {
      setMediaVisible(true);
      video.removeEventListener("playing", revealVideo);
    };

    video.addEventListener("playing", revealVideo);

    try {
      await video.play();
    } catch {
      video.removeEventListener("playing", revealVideo);
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video?.duration) return;

    const remaining = video.duration - video.currentTime;
    if (remaining <= FADE_BEFORE_END_SEC) {
      startExit();
    }
  };

  const handleVideoEnd = () => {
    startExit();
  };

  const handleTransitionEnd = (e) => {
    if (e.propertyName === "opacity" && exiting) {
      finishIntro();
    }
  };

  useEffect(() => {
    if (!exiting) return;

    const timer = setTimeout(finishIntro, FADE_DURATION_MS + 100);

    return () => clearTimeout(timer);
  }, [exiting, finishIntro]);

  return (
    <div
      className={`intro ${isPlaying ? "intro--playing" : "intro--poster"} ${mediaVisible ? "intro--media-visible" : ""} ${exiting ? "intro--exiting" : ""}`}
      onClick={!isPlaying ? handleStart : undefined}
      onKeyDown={
        !isPlaying
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") handleStart();
            }
          : undefined
      }
      onTransitionEnd={handleTransitionEnd}
      role={!isPlaying ? "button" : undefined}
      tabIndex={!isPlaying ? 0 : undefined}
      aria-label={!isPlaying ? "Սեղմեք վիդեոն դիտելու համար" : undefined}
    >
      <div className="intro__media">
        <video
          ref={videoRef}
          className="intro__video"
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          playsInline
          preload="auto"
          disablePictureInPicture
          controls={false}
          controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
          onContextMenu={(e) => e.preventDefault()}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnd}
        />
        <img src={POSTER_SRC} alt="" className="intro__poster" aria-hidden="true" />
      </div>

      {!isPlaying && <p className="intro__hint">Սեղմեք</p>}
    </div>
  );
};

export default Intro;
