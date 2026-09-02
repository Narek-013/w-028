import "../../App.css";
import { Imgs } from "../../img/imgs";
import Clock from "../Clock/Clock";
import LocationItem from "../LocationItem/LocationItem";
import "./Location.scss";

const Location = () => {
  return (
    <div className="Location">
      <div className="Location_container container">
        {/* <h2>LOCATIONS</h2> */}
        {/* <LocationItem
          placeName={"15։00-ին կհանդիպենք Հովհաննավանք վանական համալիրում։"}
          placeImg={Imgs.artur_maria_church}
          lat={40.339544}
          lon={44.388709}
        /> */}
        {/* <LocationItem
          placeName="Մեր հարսանիքի արարողությունը տեղի կունենա Ոսկեվազ գինեգործարանի ռեստորանային հատվածում։ Ոսկեվազում կհանդիպենք 17։00-ին։"
          placeImg={Imgs.artur_maria_restaurant}
          lat={40.270046}
          lon={44.293911}
        /> */}
        {/* <Clock/> */}
      </div>
    </div>
  );
};

export default Location;
