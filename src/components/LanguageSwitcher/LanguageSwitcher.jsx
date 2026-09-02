import { useEffect, useRef, useState } from "react";
import { getAssetUrl } from "../../lib/directus";
import { useLanguage } from "../../context/LanguageContext";
import "./LanguageSwitcher.scss";

const LanguageSwitcher = () => {
  const { languages, languageCode, currentLanguage, setLanguageCode, loading } =
    useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  if (loading || languages.length <= 1) return null;

  const currentFlagUrl = getAssetUrl(currentLanguage?.flag);

  const handleSelect = (code) => {
    setLanguageCode(code);
    setIsOpen(false);
  };

  return (
    <div
      className={`LanguageSwitcher${isOpen ? " is-open" : ""}`}
      ref={menuRef}
    >
      <button
        type="button"
        className="LanguageSwitcher_trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={currentLanguage?.name ?? "Language"}
      >
        {currentFlagUrl ? (
          <img src={currentFlagUrl} alt="" className="LanguageSwitcher_flag" />
        ) : (
          <span className="LanguageSwitcher_code">
            {currentLanguage?.code?.toUpperCase()}
          </span>
        )}
        <span className="LanguageSwitcher_chevron" aria-hidden="true" />
      </button>

      {isOpen && (
        <ul className="LanguageSwitcher_menu" role="listbox">
          {languages.map((language) => {
            const flagUrl = getAssetUrl(language.flag);
            const isActive = language.code === languageCode;

            return (
              <li key={language.code} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  className={`LanguageSwitcher_option${isActive ? " is-active" : ""}`}
                  onClick={() => handleSelect(language.code)}
                  aria-label={language.name}
                >
                  {flagUrl ? (
                    <img
                      src={flagUrl}
                      alt=""
                      className="LanguageSwitcher_flag"
                    />
                  ) : (
                    <span className="LanguageSwitcher_code">
                      {language.code.toUpperCase()}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default LanguageSwitcher;
