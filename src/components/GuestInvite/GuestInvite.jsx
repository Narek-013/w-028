import { useEffect, useRef } from "react";
import "../../App.css";
import { useLanguage } from "../../context/LanguageContext";
import "./GuestInvite.scss";

const FALLBACK_TRANSLATIONS = {
  hy: {
    title: "Հարգելի՛ հյուրեր",
    body:
      "Այս տարվա օրերից մեկը մեզ համար առանձնահատուկ է լինելու, և մենք ցանկանում ենք այն անցկացնել մեր հարազատների ու ընկերների շրջապատում։ Մեծ սիրով հրավիրում ենք ձեզ ամենահուզիչ տոնին՝ մեր հարսանիքին։",
  },
  en: {
    title: "Dear guests",
    body:
      "One of the days this year will be special for us, and we want to spend it surrounded by our relatives and friends. With great love, we invite you to the most exciting celebration — our wedding.",
  },
  ru: {
    title: "Дорогие гости",
    body:
      "Один из дней этого года будет особенным для нас, и мы хотим провести его в окружении наших родных и друзей. С большой любовью приглашаем вас на самый волнующий праздник — нашу свадьбу.",
  },
};

const GuestInvite = () => {
  const { languageCode, guestInviteTranslations } = useLanguage();
  const headerRef = useRef(null);
  const textRef = useRef(null);

  const fallback =
    FALLBACK_TRANSLATIONS[languageCode] ?? FALLBACK_TRANSLATIONS.hy;
  const title = guestInviteTranslations?.title ?? fallback.title;
  const body = guestInviteTranslations?.body ?? fallback.body;

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
