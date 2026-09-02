import { useEffect, useRef, useState } from "react";
import "./Clock.scss";

const Clock = () => {
  const [timeLeft, setTimeLeft] = useState([0, 0, 0, 0]);
  const blocksRef = useRef([]);

  useEffect(() => {
    const updateTimer = () => {
      const dateEnd = new Date("2026-10-26T00:00:00").getTime();
      const dateStart = new Date().getTime();
      const time = dateEnd - dateStart;

      if (time > 0) {
        const days = Math.floor(time / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (time % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
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

  const labels = ["Days", "Hours", "Minutes", "Seconds"];

  return (
    <div className="Clock">
      <div className="clock__container container">
        <div className="clock_time">
          {labels.map((label, idx) => (
            <div className="clock__item" key={label}>
              <div
                className="clock__item-block"
                ref={(el) => (blocksRef.current[idx] = el)}
              >
                <span className="current">{timeLeft[idx]}</span>
              </div>
              <p>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Clock;
