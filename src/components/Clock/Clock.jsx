import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { ARMENIAN_FALLBACKS } from "../../lib/armenianFallbacks";
import { resolveTranslations } from "../../lib/resolveTranslations";
import "./Clock.scss";

const LABEL_KEYS = ["label_days", "label_hours", "label_minutes", "label_seconds"];

const Clock = () => {
  const { languageCode, clockTranslations } = useLanguage();
  const [timeLeft, setTimeLeft] = useState([0, 0, 0, 0]);
  const blocksRef = useRef([]);

  const labels = useMemo(
    () =>
      resolveTranslations(
        languageCode,
        clockTranslations,
        ARMENIAN_FALLBACKS.clock,
      ),
    [languageCode, clockTranslations],
  );

  useEffect(() => {
    const updateTimer = () => {
      const dateEnd = new Date("2026-10-26T00:00:00").getTime();
      const dateStart = new Date().getTime();
      const time = dateEnd - dateStart;

      if (time > 0) {
        const days = Math.floor(time / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (time % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((time % (1000 * 60)) / 1000);
        setTimeLeft([days, hours, minutes, seconds]);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    timeLeft.forEach((value, idx) => {
      const block = blocksRef.current[idx];
      if (!block) return;

      const oldSpan = block.querySelector(".current");
      if (oldSpan && oldSpan.textContent === value.toString()) return;

      const newSpan = document.createElement("span");
      newSpan.textContent = value;
      newSpan.classList.add("new");
      block.appendChild(newSpan);

      setTimeout(() => {
        if (oldSpan) {
          oldSpan.style.transform = "translateY(-100%)";
          oldSpan.style.opacity = "0";
        }
        newSpan.style.transform = "translateY(0)";
        newSpan.style.opacity = "1";
      }, 50);

      setTimeout(() => {
        oldSpan?.remove();
        newSpan.classList.remove("new");
        newSpan.classList.add("current");
      }, 500);
    });
  }, [timeLeft]);

  return (
    <div className="Clock">
      <div className="clock__container container">
        <div className="clock_time">
          {LABEL_KEYS.map((key, idx) => (
            <div className="clock__item" key={key}>
              <div
                className="clock__item-block"
                ref={(el) => {
                  blocksRef.current[idx] = el;
                }}
              >
                <span className="current">{timeLeft[idx]}</span>
              </div>
              <p>{labels[key]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Clock;
