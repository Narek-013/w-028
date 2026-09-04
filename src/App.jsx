import { useEffect, useState } from "react";
import Confirm from "./components/Confirm/Confirm";
import MainSection from "./components/MainSection/MainSection";
import GuestInvite from "./components/GuestInvite/GuestInvite";
import LoveStoryblock from "./components/LoveStoryblock/LoveStoryblock";
import Location from "./components/Location/Location";
import Sound from "./components/Sound/Sound";
import LanguageSwitcher from "./components/LanguageSwitcher/LanguageSwitcher";
import Intro from "./components/Intro/Intro";
import DressCode from "./components/DressCode/DressCode";
import OurImgs from "./components/OurImgs/OurImgs";
import "./App.css";

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    if (!showIntro) return;

    const preventScroll = (e) => e.preventDefault();

    document.documentElement.classList.add("intro-locked");
    document.addEventListener("wheel", preventScroll, { passive: false });
    document.addEventListener("touchmove", preventScroll, { passive: false });

    return () => {
      document.documentElement.classList.remove("intro-locked");
      document.removeEventListener("wheel", preventScroll);
      document.removeEventListener("touchmove", preventScroll);
    };
  }, [showIntro]);

  useEffect(() => {
    const blockContext = (e) => e.preventDefault();

    const handleKeyDown = (e) => {
      // արգելափակում
      if (
        e.keyCode === 123 || // F12
        (e.ctrlKey && e.shiftKey && [73, 74, 67].includes(e.keyCode)) || // Ctrl+Shift+I/J/C
        (e.ctrlKey && e.keyCode === 85) || // Ctrl+U
        (e.ctrlKey && e.shiftKey && e.keyCode === 75) // Ctrl+Shift+K
      ) {
        e.preventDefault();
      }
    };

    const devToggle = (e) => {
      // Ctrl + Alt + D  ⇒  հանում ենք արգելափակումը
      if (e.ctrlKey && e.altKey && e.key === "d") {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("contextmenu", blockContext);
        alert("DevTools‑ը ապակողպված է, սեղմիր F12 🙂");
      }
    };

    document.addEventListener("contextmenu", blockContext);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keydown", devToggle);

    return () => {
      document.removeEventListener("contextmenu", blockContext);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keydown", devToggle);
    };
  }, []);
  
  return (
    <div
      className={`App ${contentVisible ? "App--revealed" : ""} ${showIntro ? "App--intro-active" : ""}`}
    >
      {showIntro && (
        <Intro
          onFadeStart={() => setContentVisible(true)}
          onComplete={() => setShowIntro(false)}
        />
      )}
      <LanguageSwitcher />
      <Sound />
      <div className="App_content">
        <LoveStoryblock />
        <GuestInvite />
        <MainSection />
        <Location />
        <DressCode />
        <OurImgs />
        <Confirm />
      </div>
    </div>
  );
}

export default App;
