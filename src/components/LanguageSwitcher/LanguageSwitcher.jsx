import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import "./LanguageSwitcher.scss";

const FlagMark = ({ code }) => {
  const [failed, setFailed] = useState(false);
  const src = code ? `/flags/${code}.svg` : null;

  if (!src || failed) {
    return (
      <span className="LanguageSwitcher_code">
        {code?.toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className="LanguageSwitcher_flag"
      onError={() => setFailed(true)}
    />
  );
};

const LanguageSwitcher = () => {
  const { availableLanguages, languageCode, currentLanguage, setLanguageCode, loading } =
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

  if (loading || availableLanguages.length <= 1) return null;

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
        <FlagMark code={currentLanguage?.code} />
        <span className="LanguageSwitcher_chevron" aria-hidden="true" />
      </button>

      {isOpen && (
        <ul className="LanguageSwitcher_menu" role="listbox">
          {availableLanguages.map((language) => {
            const isActive = language.code === languageCode;

            return (
              <li key={language.code} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  className={`LanguageSwitcher_option${isActive ? " is-active" : ""}`}
                  onClick={() => handleSelect(language.code)}
                  aria-label={language.name}
                >
                  <FlagMark code={language.code} />
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
