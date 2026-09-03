import { useEffect, useRef } from "react";
import "../../App.css";
import "./LocationItem.scss";

const LocationItem = ({
  placeName,
  placeImg,
  lat,
  lon,
  icon,
  time,
  event,
  placeImgClass,
  mapButtonLabel = "Քարտեզ",
}) => {
  const itemRef = useRef(null);

  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(el);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.classList.add("is-visible");
          });
        });
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const getNavigationLink = () => {
    const yandexNavi = `yandexnavi://build_route_on_map?lat_to=${lat}&lon_to=${lon}`;
    const googleMaps = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

    return {
      primary: yandexNavi,
      fallback: googleMaps,
    };
  };
  const { primary, fallback } = getNavigationLink();

  return (
    <div className="LocationItem" ref={itemRef}>
      <div className="location-context">
        <img src={icon} alt="wedding-icon" />
        <p className="time">{time}</p>
        <p className="event">{event}</p>
        <p className="place-name">{placeName}</p>
      </div>
      <img
        className={`place-img ${placeImgClass ?? ""}`}
        src={placeImg}
        alt=""
      />
      <button
        type="button"
        onClick={() => {
          window.location.href = primary;

          setTimeout(() => {
            window.location.href = fallback;
          }, 1500);
        }}
      >
        {mapButtonLabel}
      </button>
    </div>
  );
};

export default LocationItem;
