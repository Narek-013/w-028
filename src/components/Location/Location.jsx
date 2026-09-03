import "../../App.css";
import { Imgs } from "../../img/imgs";
import { useLanguage } from "../../context/LanguageContext";
import { ARMENIAN_FALLBACKS } from "../../lib/armenianFallbacks";
import { resolveTranslations } from "../../lib/resolveTranslations";
import LocationItem from "../LocationItem/LocationItem";
import "./Location.scss";

const LOCATION_EVENTS = [
  {
    icon: Imgs.rings_icon,
    placeImgClass: "church",
    placeImg: Imgs.church,
    lat: 40.167176,
    lon: 44.309552,
    timeKey: "event_1_time",
    eventKey: "event_1_title",
    placeKey: "event_1_place",
  },
  {
    icon: Imgs.glass_icon,
    placeImg: Imgs.restaurant,
    lat: 40.137582,
    lon: 44.460454,
    timeKey: "event_2_time",
    eventKey: "event_2_title",
    placeKey: "event_2_place",
  },
];

const Location = () => {
  const { languageCode, locationTranslations } = useLanguage();
  const labels = resolveTranslations(
    languageCode,
    locationTranslations,
    ARMENIAN_FALLBACKS.location,
  );

  return (
    <div className="Location">
      <div className="Location_container container">
        <h2>{labels.section_title}</h2>
        {LOCATION_EVENTS.map((event) => (
          <LocationItem
            key={event.timeKey}
            icon={event.icon}
            placeImgClass={event.placeImgClass}
            time={labels[event.timeKey]}
            event={labels[event.eventKey]}
            placeName={labels[event.placeKey]}
            placeImg={event.placeImg}
            lat={event.lat}
            lon={event.lon}
            mapButtonLabel={labels.map_button}
          />
        ))}
      </div>
    </div>
  );
};

export default Location;
