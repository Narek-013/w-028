const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL?.replace(/\/$/, "");
const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN;
const COLLECTION = import.meta.env.VITE_DIRECTUS_COLLECTION || "rsvp";

export async function createRsvp(data) {
  if (!DIRECTUS_URL) {
    throw new Error("VITE_DIRECTUS_URL is not configured");
  }

  const response = await fetch(`${DIRECTUS_URL}/items/${COLLECTION}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(DIRECTUS_TOKEN && { Authorization: `Bearer ${DIRECTUS_TOKEN}` }),
    },
    body: JSON.stringify(data),
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
