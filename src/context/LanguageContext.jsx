import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchCalendarTranslations, fetchClockTranslations, fetchGuestInviteTranslations, fetchLanguages } from "../lib/directus";

const STORAGE_KEY = "wedding_locale";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [languages, setLanguages] = useState([]);
  const [languageCode, setLanguageCode] = useState(
    () => localStorage.getItem(STORAGE_KEY) || null,
  );
  const [calendarTranslations, setCalendarTranslations] = useState(null);
  const [guestInviteTranslations, setGuestInviteTranslations] = useState(null);
  const [clockTranslations, setClockTranslations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLanguages() {
      try {
        const items = await fetchLanguages();
        if (cancelled) return;

        setLanguages(items);

        const stored = localStorage.getItem(STORAGE_KEY);
        const storedLanguage = items.find((item) => item.code === stored);
        const defaultLanguage = items.find((item) => item.default) ?? items[0];

        if (!storedLanguage && defaultLanguage) {
          setLanguageCode(defaultLanguage.code);
        } else if (!languageCode && defaultLanguage) {
          setLanguageCode(defaultLanguage.code);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLanguages();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!languageCode) return;

    let cancelled = false;
    localStorage.setItem(STORAGE_KEY, languageCode);
    setCalendarTranslations(null);
    setGuestInviteTranslations(null);
    setClockTranslations(null);

    async function loadTranslations() {
      try {
        const [calendar, guestInvite, clock] = await Promise.all([
          fetchCalendarTranslations(languageCode),
          fetchGuestInviteTranslations(languageCode),
          fetchClockTranslations(languageCode),
        ]);
        if (!cancelled) {
          setCalendarTranslations(calendar);
          setGuestInviteTranslations(guestInvite);
          setClockTranslations(clock);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    loadTranslations();
    return () => {
      cancelled = true;
    };
  }, [languageCode]);

  const currentLanguage = useMemo(
    () => languages.find((item) => item.code === languageCode) ?? null,
    [languages, languageCode],
  );

  const value = useMemo(
    () => ({
      languages,
      languageCode,
      currentLanguage,
      calendarTranslations,
      guestInviteTranslations,
      clockTranslations,
      loading,
      error,
      setLanguageCode,
    }),
    [languages, languageCode, currentLanguage, calendarTranslations, guestInviteTranslations, clockTranslations, loading, error],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
