import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchAllTranslationsForLanguage,
  fetchCalendarTranslations,
  fetchClockTranslations,
  fetchDressCodeTranslations,
  fetchConfirmTranslations,
  fetchGuestInviteTranslations,
  fetchLanguages,
  fetchLocationTranslations,
} from "../lib/directus";
import { hasCompleteCmsTranslations } from "../lib/translationRequirements";

const STORAGE_KEY = "wedding_locale";
const ARMENIAN_CODE = "hy";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [languages, setLanguages] = useState([]);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [languageCode, setLanguageCode] = useState(
    () => localStorage.getItem(STORAGE_KEY) || ARMENIAN_CODE,
  );
  const [calendarTranslations, setCalendarTranslations] = useState(null);
  const [guestInviteTranslations, setGuestInviteTranslations] = useState(null);
  const [clockTranslations, setClockTranslations] = useState(null);
  const [locationTranslations, setLocationTranslations] = useState(null);
  const [dressCodeTranslations, setDressCodeTranslations] = useState(null);
  const [confirmTranslations, setConfirmTranslations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!languageCode) return;
    document.documentElement.lang = languageCode;
  }, [languageCode]);

  useEffect(() => {
    let cancelled = false;

    async function loadLanguages() {
      try {
        const items = await fetchLanguages();
        if (cancelled) return;

        setLanguages(items);

        const hyLanguage = items.find((item) => item.code === ARMENIAN_CODE);
        const nonHyLanguages = items.filter((item) => item.code !== ARMENIAN_CODE);

        const cmsReadyLanguages = await Promise.all(
          nonHyLanguages.map(async (language) => {
            try {
              const translations = await fetchAllTranslationsForLanguage(
                language.code,
              );
              return hasCompleteCmsTranslations(translations) ? language : null;
            } catch {
              return null;
            }
          }),
        );

        if (cancelled) return;

        const ready = cmsReadyLanguages.filter(Boolean);
        const nextAvailable = hyLanguage ? [hyLanguage, ...ready] : ready;
        setAvailableLanguages(nextAvailable);

        const stored = localStorage.getItem(STORAGE_KEY);
        const defaultLanguage =
          nextAvailable.find((item) => item.code === ARMENIAN_CODE) ??
          nextAvailable[0] ??
          null;

        setLanguageCode((current) => {
          const storedLanguage = nextAvailable.find((item) => item.code === stored);
          if (storedLanguage) return storedLanguage.code;
          if (defaultLanguage) return defaultLanguage.code;
          if (
            current &&
            !nextAvailable.some((item) => item.code === current) &&
            defaultLanguage
          ) {
            return defaultLanguage.code;
          }
          return current;
        });
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
    setLocationTranslations(null);
    setDressCodeTranslations(null);
    setConfirmTranslations(null);

    async function loadTranslations() {
      try {
        const [calendar, guestInvite, clock, location, dressCode, confirm] =
          await Promise.all([
            fetchCalendarTranslations(languageCode),
            fetchGuestInviteTranslations(languageCode),
            fetchClockTranslations(languageCode),
            fetchLocationTranslations(languageCode),
            fetchDressCodeTranslations(languageCode),
            fetchConfirmTranslations(languageCode),
          ]);
        if (!cancelled) {
          setCalendarTranslations(calendar);
          setGuestInviteTranslations(guestInvite);
          setClockTranslations(clock);
          setLocationTranslations(location);
          setDressCodeTranslations(dressCode);
          setConfirmTranslations(confirm);
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
    () => availableLanguages.find((item) => item.code === languageCode) ?? null,
    [availableLanguages, languageCode],
  );

  const value = useMemo(
    () => ({
      languages,
      availableLanguages,
      languageCode,
      currentLanguage,
      calendarTranslations,
      guestInviteTranslations,
      clockTranslations,
      locationTranslations,
      dressCodeTranslations,
      confirmTranslations,
      loading,
      error,
      setLanguageCode,
    }),
    [
      languages,
      availableLanguages,
      languageCode,
      currentLanguage,
      calendarTranslations,
      guestInviteTranslations,
      clockTranslations,
      locationTranslations,
      dressCodeTranslations,
      confirmTranslations,
      loading,
      error,
    ],
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
