import "../../App.css";
import { Imgs } from "../../img/imgs";
import WeddingDate from "../WeddingDate/WeddingDate";
import "./MainSection.scss";

const MainSection = () => {
  return (
    <div className="MainSection">
      <div className="MainSection_container container">
        <h2>YOU ARE INVITED</h2>
        {/* <p>Սիրով հրավիրում ենք Ձեզ մեր հարսանիքին</p>
        <div className="images-box">
          <img src={Imgs.artur_maria1} alt="wedding" />
          <img src={Imgs.artur_maria2} alt="wedding" />
        </div> */}
        <WeddingDate/>
      </div>
    </div>
  );
};
export default MainSection;
