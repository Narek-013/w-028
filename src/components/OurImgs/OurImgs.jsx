import { useCallback, useEffect, useRef, useState } from "react";
import "./OurImgs.scss";

const SLIDES = ["/and1.jpg", "/and2.jpg", "/Sam&Inna.jpg"];

const OurImgs = () => {
  const [index, setIndex] = useState(0);
  const [focused, setFocused] = useState(false);
  const touchStartX = useRef(0);
  const didSwipe = useRef(false);

  const goTo = useCallback((next) => {
    setIndex((next + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (focused) return;

    const timer = window.setInterval(() => {
      goTo(index + 1);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [focused, goTo, index]);

  const onTouchStart = (event) => {
    didSwipe.current = false;
    touchStartX.current = event.touches[0].clientX;
  };

  const onTouchEnd = (event) => {
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) < 40) return;
    didSwipe.current = true;
    goTo(index + (delta < 0 ? 1 : -1));
  };

  const onSlideClick = (slideIndex) => {
    if (didSwipe.current) return;

    if (focused) {
      setFocused(false);
      return;
    }

    setIndex(slideIndex);
    setFocused(true);
  };

  return (
    <section className="OurImgs" aria-label="Our photos">
      <div className="OurImgs_container container">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="OurImgs_heart"
          aria-hidden="true"
        >
          <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.5 5.5 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
        </svg>

        <div
          className={`OurImgs_slider${focused ? " is-focused" : ""}`}
          style={{ "--index": index }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="OurImgs_track">
            {SLIDES.map((src, slideIndex) => (
              <figure
                className={`OurImgs_slide${slideIndex === index ? " is-active" : ""}`}
                key={src}
              >
                <button
                  type="button"
                  className="OurImgs_photo"
                  onClick={() => onSlideClick(slideIndex)}
                  aria-label={focused ? "Show gallery" : "View photo"}
                >
                  <img src={src} alt="" draggable="false" />
                </button>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OurImgs;
