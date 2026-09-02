import "../../App.css";
import { Imgs } from "../../img/imgs";
import LocationItem from "../LocationItem/LocationItem";
import "./Locations.scss";

const Locations = () => {
  return (
    <div className="Locations">
      <div className="Locations_container container">
        <h3>With love, we invite you to share in our joy
          and celebrate our special day together.</h3>
        <LocationItem
          placeName="Moonlight Restaurant Glendale"
          address="1022 E Chevy Chase dr, Glendale, CA, 91205"
          lat={34.133378}
          lon={-118.242218}
          />
          <h2>We look forward to celebrating with you</h2>
      </div>
    </div>
  );
};

export default Locations;
