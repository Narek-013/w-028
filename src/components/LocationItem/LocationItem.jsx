import "../../App.css";
import "./LocationItem.scss";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const LocationItem = ({
  placeName,
  address,
  lat,
  lon,
}) => {
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
  
  const getNavigationLink = () => {
    const yandexNavi = `yandexnavi://build_route_on_map?lat_to=${lat}&lon_to=${lon}`;
    const yandexWeb = `https://yandex.com/maps/?rtext=~${lat},${lon}&rtt=auto`;
    const googleMaps = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

    // Սա fallback տարբերակ է՝ եթե Yandex.Navigator-ը բացել չհաջողվի, օգտատերը կարող է Google Maps-ով գնալ
    return {
      primary: yandexNavi,
      fallback: googleMaps,
      web: yandexWeb,
    };
  };
  const { primary, fallback } = getNavigationLink();

  return (
    <div className="LocationItem" data-aos="fade-up">
        <p className="place-name">{placeName}</p> 
        <p className="address">{address}</p>
      {/* <a href={location}>Քարտեզ</a> */}
      <button
        onClick={() => {
          // Attempt to open Yandex.Navigator
          window.location.href = primary;

          // If not opened within 1.5s, redirect to Google Maps
          setTimeout(() => {
            window.location.href = fallback;
          }, 1500);
        }}
      >
        Map
      </button>
    </div>
  );
};

export default LocationItem;
