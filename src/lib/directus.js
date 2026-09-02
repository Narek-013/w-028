const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL?.replace(/\/$/, "");
const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN;
const COLLECTION = import.meta.env.VITE_DIRECTUS_COLLECTION || "rsvp";

function getHeaders() {
  return {
    "Content-Type": "application/json",
    ...(DIRECTUS_TOKEN && { Authorization: `Bearer ${DIRECTUS_TOKEN}` }),
  };
}

async function directusFetch(path, options = {}) {
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

export function getAssetUrl(fileId) {
  if (!DIRECTUS_URL || !fileId) return null;
  return `${DIRECTUS_URL}/assets/${fileId}`;
}

export async function createRsvp(data) {
  return directusFetch(`/items/${COLLECTION}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchLanguages() {
  const params = new URLSearchParams({
    "filter[enable][_eq]": "true",
    sort: "sort",
    fields: "id,code,name,locale_code,default,flag",
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
