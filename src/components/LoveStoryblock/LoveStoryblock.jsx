import { Imgs } from "../../img/imgs";
import "../../App.css";
import "./LoveStoryblock.scss";

const LoveStoryblock = () => {
  return (
    <section className="LoveStoryblock" aria-label="Love story">
      <div className="LoveStoryblock_sequence container">
        <div className="LoveStoryblock_segment LoveStoryblock_segment--focus">
          <img
            className="LoveStoryblock_image"
            src={Imgs.main_img}
            alt=""
            draggable="false"
          />
        </div>
      </div>
    </section>
  );
};

export default LoveStoryblock;
