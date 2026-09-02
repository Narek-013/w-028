import "../../App.css";
import { Imgs } from "../../img/imgs";
import Clock from "../Clock/Clock";
import WeddingDate from "../WeddingDate/WeddingDate";
import "./MainSection.scss";

const MainSection = () => {
  return (
    <div className="MainSection">
      <div className="MainSection_container container">
        <WeddingDate/>
        <Clock />
      </div>
    </div>
  );
};
export default MainSection;
