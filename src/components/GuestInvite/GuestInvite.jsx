import { useEffect, useRef } from "react";
import "../../App.css";
import { useLanguage } from "../../context/LanguageContext";
import { ARMENIAN_FALLBACKS } from "../../lib/armenianFallbacks";
import { resolveTranslations } from "../../lib/resolveTranslations";
import "./GuestInvite.scss";

const GuestInvite = () => {
  const { languageCode, guestInviteTranslations } = useLanguage();
  const headerRef = useRef(null);
  const textRef = useRef(null);

  const labels = resolveTranslations(
    languageCode,
    guestInviteTranslations,
    ARMENIAN_FALLBACKS.guestInvite,
  );
  const title = labels.title;
  const body = labels.body;

  useEffect(() => {
    const elements = [headerRef.current, textRef.current].filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="GuestInvite">
      <div className="GuestInvite_container container">
        <div
          ref={headerRef}
          className="GuestInvite_reveal-zoom"
          style={{ transitionDelay: "0ms" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="GuestInvite_icon"
            aria-hidden="true"
          >
            <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
            <rect x="2" y="4" width="20" height="16" rx="2" />
          </svg>
          <h2>{title}</h2>
        </div>

        <div
          ref={textRef}
          className="GuestInvite_reveal"
          style={{ transitionDelay: "200ms" }}
        >
          <p>{body}</p>
        </div>
      </div>
    </section>
  );
};

export default GuestInvite;
