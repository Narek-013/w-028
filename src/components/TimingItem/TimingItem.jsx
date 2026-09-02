import "../../App.css";
import AOS from "aos";
import { useEffect } from "react";
import "aos/dist/aos.css";
import "./TimingItem.scss";

const TimingItem = ({ time, place, image }) => {
  useEffect(() => {
    AOS.init({
      offset: 120, // offset (in px) from the original trigger point
      delay: 0, // values from 0 to 3000, with step 50ms
      duration: 400, // values from 0 to 3000, with step 50ms
      easing: "ease", // default easing for AOS animations
      once: false, // whether animation should happen only once
      mirror: false, // whether elements should animate out while scrolling past them
      anchorPlacement: "top-bottom", // whether animation should happen only once - while scrolling down (optional)
    });
  }, []);
  return (
    <div className="TimingItem" data-aos="fade-up">
      <div className="timing-info">
        <p>{time}</p>
        <h3>{time}</h3>
        <h4>{place}</h4>
      </div>
    </div>
  );
};

export default TimingItem;
