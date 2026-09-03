const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN;
const COLLECTION = import.meta.env.VITE_DIRECTUS_COLLECTION || "rsvp";

function getDirectusUrl() {
  const configured = import.meta.env.VITE_DIRECTUS_URL?.replace(/\/$/, "") || "";
  const pageHost = window.location.hostname;
  const isLanPage = pageHost !== "localhost" && pageHost !== "127.0.0.1";

  if (import.meta.env.DEV && isLanPage) {
    return `${window.location.origin}/directus`;
  }

  return configured;
}

function getFileId(file) {
  if (!file) return null;
  if (typeof file === "string") return file;
  if (typeof file === "object" && typeof file.id === "string") return file.id;
  return null;
}

function getHeaders() {
  return {
    "Content-Type": "application/json",
    ...(DIRECTUS_TOKEN && { Authorization: `Bearer ${DIRECTUS_TOKEN}` }),
  };
}

async function directusFetch(path, options = {}) {
  const DIRECTUS_URL = getDirectusUrl();
  if (!DIRECTUS_URL) {
    throw new Error("VITE_DIRECTUS_URL is not configured");
  }

  const response = await fetch(`${DIRECTUS_URL}${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result.errors?.[0]?.message ||
      result.message ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return result;
}

export function getAssetUrl(file) {
  const DIRECTUS_URL = getDirectusUrl();
  const fileId = getFileId(file);
  if (!DIRECTUS_URL || !fileId) return null;
  return `${DIRECTUS_URL}/assets/${fileId}`;
}

export async function createRsvp(data) {
  return directusFetch(`/items/${COLLECTION}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchRsvpById(id) {
  if (!id) return null;

  const DIRECTUS_URL = getDirectusUrl();
  if (!DIRECTUS_URL) {
    throw new Error("VITE_DIRECTUS_URL is not configured");
  }

  const response = await fetch(
    `${DIRECTUS_URL}/items/${COLLECTION}/${id}?fields=id,name,last_name,attending,guest_count`,
    { headers: getHeaders() },
  );

  if (response.status === 403 || response.status === 401) {
    throw new Error("RSVP read is not permitted");
  }

  if (response.status === 404) {
    return null;
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.errors?.[0]?.message ||
        result.message ||
        `Request failed (${response.status})`,
    );
  }

  return result.data ?? null;
}

export async function findRsvpByName(name, lastName) {
  try {
    const params = new URLSearchParams({
      "filter[name][_eq]": name,
      "filter[last_name][_eq]": lastName,
      fields: "id,name,last_name,attending,guest_count",
      limit: "1",
    });

    const result = await directusFetch(`/items/${COLLECTION}?${params}`);
    return result.data?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function fetchLanguages() {
  const params = new URLSearchParams({
    "filter[enable][_eq]": "true",
    sort: "sort",
    fields: "id,code,name,locale_code,default,flag.id",
  });

  const result = await directusFetch(`/items/languages?${params}`);
  return result.data ?? [];
}

export async function fetchCalendarTranslations(languageCode) {
  const params = new URLSearchParams({
    "filter[language][code][_eq]": languageCode,
    fields: [
      "id",
      "month_1",
      "month_2",
      "month_3",
      "month_4",
      "month_5",
      "month_6",
      "month_7",
      "month_8",
      "month_9",
      "month_10",
      "month_11",
      "month_12",
      "weekday_mon",
      "weekday_tue",
      "weekday_wed",
      "weekday_thu",
      "weekday_fri",
      "weekday_sat",
      "weekday_sun",
      "language.code",
    ].join(","),
    limit: "1",
  });

  const result = await directusFetch(`/items/calendar_translations?${params}`);
  return result.data?.[0] ?? null;
}

export async function fetchGuestInviteTranslations(languageCode) {
  const params = new URLSearchParams({
    "filter[language][code][_eq]": languageCode,
    fields: ["id", "title", "body", "language.code"].join(","),
    limit: "1",
  });

  const result = await directusFetch(`/items/guest_invite_translations?${params}`);
  return result.data?.[0] ?? null;
}

export async function fetchClockTranslations(languageCode) {
  const params = new URLSearchParams({
    "filter[language][code][_eq]": languageCode,
    fields: [
      "id",
      "label_days",
      "label_hours",
      "label_minutes",
      "label_seconds",
      "language.code",
    ].join(","),
    limit: "1",
  });

  const result = await directusFetch(`/items/clock_translations?${params}`);
  return result.data?.[0] ?? null;
}

export async function fetchLocationTranslations(languageCode) {
  const params = new URLSearchParams({
    "filter[language][code][_eq]": languageCode,
    fields: [
      "id",
      "section_title",
      "map_button",
      "event_1_time",
      "event_1_title",
      "event_1_place",
      "event_2_time",
      "event_2_title",
      "event_2_place",
      "language.code",
    ].join(","),
    limit: "1",
  });

  const result = await directusFetch(`/items/location_translations?${params}`);
  return result.data?.[0] ?? null;
}

export async function fetchDressCodeTranslations(languageCode) {
  const params = new URLSearchParams({
    "filter[language][code][_eq]": languageCode,
    fields: ["id", "title", "body", "language.code"].join(","),
    limit: "1",
  });

  const result = await directusFetch(`/items/dress_code_translations?${params}`);
  return result.data?.[0] ?? null;
}

export async function fetchConfirmTranslations(languageCode) {
  const params = new URLSearchParams({
    "filter[language][code][_eq]": languageCode,
    fields: [
      "id",
      "title",
      "intro",
      "deadline",
      "already_confirmed",
      "placeholder_name",
      "placeholder_surname",
      "placeholder_guests",
      "attendance_question",
      "attend_yes",
      "attend_no",
      "submit",
      "name_hint",
      "error_name",
      "error_count",
      "error_send",
      "language.code",
    ].join(","),
    limit: "1",
  });

  const result = await directusFetch(`/items/confirm_translations?${params}`);
  return result.data?.[0] ?? null;
}

export async function fetchAllTranslationsForLanguage(languageCode) {
  const [calendar, guestInvite, clock, location, dressCode, confirm] =
    await Promise.all([
      fetchCalendarTranslations(languageCode),
      fetchGuestInviteTranslations(languageCode),
      fetchClockTranslations(languageCode),
      fetchLocationTranslations(languageCode),
      fetchDressCodeTranslations(languageCode),
      fetchConfirmTranslations(languageCode),
    ]);

  return { calendar, guestInvite, clock, location, dressCode, confirm };
}
