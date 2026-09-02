import Confirm from "./components/Confirm/Confirm";
import Location from "./components/Location/Location";
import MainSection from "./components/MainSection/MainSection";
// import Timing from "./components/Timing/Timing";
// import WeddingDate from "./components/WeddingDate/WeddingDate";
// import Clock from "./components/Clock/Clock";
import Sound from "./components/Sound/Sound";
import "./App.css";
import Locations from "./components/Locations/Locations";

function App() {
  // useEffect(() => {
  //   const blockContext = (e) => e.preventDefault();

  //   const handleKeyDown = (e) => {
  //     // արգելափակում
  //     if (
  //       e.keyCode === 123 || // F12
  //       (e.ctrlKey && e.shiftKey && [73, 74, 67].includes(e.keyCode)) || // Ctrl+Shift+I/J/C
  //       (e.ctrlKey && e.keyCode === 85) || // Ctrl+U
  //       (e.ctrlKey && e.shiftKey && e.keyCode === 75) // Ctrl+Shift+K
  //     ) {
  //       e.preventDefault();
  //     }
  //   };

  //   const devToggle = (e) => {
  //     // Ctrl + Alt + D  ⇒  հանում ենք արգելափակումը
  //     if (e.ctrlKey && e.altKey && e.key === "d") {
  //       document.removeEventListener("keydown", handleKeyDown);
  //       document.removeEventListener("contextmenu", blockContext);
  //       alert("DevTools‑ը ապակողպված է, սեղմիր F12 🙂");
  //     }
  //   };

  //   document.addEventListener("contextmenu", blockContext);
  //   document.addEventListener("keydown", handleKeyDown);
  //   document.addEventListener("keydown", devToggle);

  //   return () => {
  //     document.removeEventListener("contextmenu", blockContext);
  //     document.removeEventListener("keydown", handleKeyDown);
  //     document.removeEventListener("keydown", devToggle);
  //   };
  // }, []);
  return (
    <div className="App">
      <Sound />
      <MainSection />
      {/* <Clock /> */}
      {/* <WeddingDate /> */}
      {/* <Timing /> */}
      <Location />
      <Locations/>
      <Confirm />
    </div>
  );
}

export default App;
