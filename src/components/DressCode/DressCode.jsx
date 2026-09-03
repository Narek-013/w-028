import { Imgs } from "../../img/imgs";
import { useLanguage } from "../../context/LanguageContext";
import { ARMENIAN_FALLBACKS } from "../../lib/armenianFallbacks";
import { resolveTranslations } from "../../lib/resolveTranslations";
import "./DressCode.scss";

const DressCode = () => {
  const { languageCode, dressCodeTranslations } = useLanguage();
  const labels = resolveTranslations(
    languageCode,
    dressCodeTranslations,
    ARMENIAN_FALLBACKS.dressCode,
  );

  return (
    <div className="DressCode">
      <div className="DressCode_container container">
        <h2>{labels.title}</h2>
        <h3>{labels.body}</h3>
        <img src={Imgs.dress_code} alt="wedding-icon" />
      </div>
    </div>
  );
};

export default DressCode;
