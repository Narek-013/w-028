import { useEffect, useRef } from "react";
import "../../App.css";
import "./LocationItem.scss";

function isAndroid() {
  return /Android/i.test(navigator.userAgent || "");
}

function getCurrentPosition(timeoutMs = 2000) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}

function buildYandexRouteWeb(lat, lon, from) {
  const rtext = from
    ? `${from.lat},${from.lon}~${lat},${lon}`
    : `~${lat},${lon}`;

  return `https://yandex.ru/maps/?rtext=${encodeURIComponent(rtext)}&rtt=auto`;
}

async function openNavigation({ lat, lon }) {
  const from = await getCurrentPosition();
  const yandexRouteWeb = buildYandexRouteWeb(lat, lon, from);

  if (isAndroid()) {
    const intentPath = from
      ? `build_route_on_map?lat_from=${from.lat}&lon_from=${from.lon}&lat_to=${lat}&lon_to=${lon}`
      : `build_route_on_map?lat_to=${lat}&lon_to=${lon}`;

    window.location.href =
      `intent://${intentPath}` +
      `#Intent;scheme=yandexnavi;package=ru.yandex.yandexnavi;` +
      `S.browser_fallback_url=${encodeURIComponent(yandexRouteWeb)};end`;
    return;
  }

  window.location.href = yandexRouteWeb;
}

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
      <button type="button" onClick={() => openNavigation({ lat, lon })}>
        {mapButtonLabel}
      </button>
    </div>
  );
};

export default LocationItem;
