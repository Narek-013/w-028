import { useCallback, useEffect, useRef, useState } from "react";
import "./Intro.scss";

const POSTER_SRC = "/intro-poster.webp";
const VIDEO_SRC = "/heart.mp4";
const FADE_DURATION_MS = 1200;
const FADE_BEFORE_END_SEC = 0.9;

const Intro = ({ onFadeStart, onComplete }) => {
  const [started, setStarted] = useState(false);
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

  const handleStart = async () => {
    setStarted(true);

    requestAnimationFrame(async () => {
      const video = videoRef.current;
      if (!video) return;

      try {
        await video.play();
      } catch {
        // autoplay may be blocked; user already tapped to start
      }
    });
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
      className={`intro ${started ? "intro--video" : "intro--poster"} ${exiting ? "intro--exiting" : ""}`}
      onClick={!started ? handleStart : undefined}
      onKeyDown={
        !started
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") handleStart();
            }
          : undefined
      }
      onTransitionEnd={handleTransitionEnd}
      role={!started ? "button" : undefined}
      tabIndex={!started ? 0 : undefined}
      aria-label={!started ? "Սեղմեք վիդեոն դիտելու համար" : undefined}
    >
      {!started ? (
        <>
          <p className="intro__hint">Սեղմեք</p>
          <img src={POSTER_SRC} alt="" className="intro__poster" />
        </>
      ) : (
        <video
          ref={videoRef}
          className="intro__video"
          src={VIDEO_SRC}
          playsInline
          autoPlay
          disablePictureInPicture
          controls={false}
          controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
          onContextMenu={(e) => e.preventDefault()}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnd}
        />
      )}
    </div>
  );
};

export default Intro;
