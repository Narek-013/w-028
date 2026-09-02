import { readSettings, updateSettings } from '@directus/sdk';

const DEFAULT_BSL_OWNER_EMAIL =
  process.env.DIRECTUS_OWNER_FOR_BSL || process.env.DIRECTUS_EMAIL || 'admin@example.com';
const DEFAULT_BSL_USAGE_TEXT = process.env.DIRECTUS_BSL_USAGE_TEXT || 'Personal / Learning';
const DIRECTUS_BSL_DEBUG = (process.env.DIRECTUS_BSL_DEBUG ?? '') === '1';

function buildBslAutoOwnerUpdateFromSettings(settings) {
  const update = {};
  if (!settings || typeof settings !== 'object') return update;

  const matches = [];

  for (const [key, value] of Object.entries(settings)) {
    if (!key) continue;
    if (key === 'license_key') continue;
    const lower = key.toLowerCase();

    // Directus v11+ BSL prompt fields:
    // - project_owner: string|null
    // - project_usage: string|null
    // - product_updates: boolean|null
    if (key === 'project_owner') {
      const nextVal = DEFAULT_BSL_OWNER_EMAIL;
      const shouldUpdate =
        value === null || value === undefined || value === '' || String(value) !== String(nextVal);
      if (shouldUpdate) {
        update[key] = nextVal;
        matches.push({ key, from: value, to: nextVal });
      }
      continue;
    }

    if (key === 'project_usage') {
      const nextVal = DEFAULT_BSL_USAGE_TEXT;
      const shouldUpdate =
        value === null || value === undefined || value === '' || String(value) !== String(nextVal);
      if (shouldUpdate) {
        update[key] = nextVal;
        matches.push({ key, from: value, to: nextVal });
      }
      continue;
    }

    if (key === 'product_updates') {
      const envOptIn = (process.env.DIRECTUS_PRODUCT_UPDATES_OPT_IN ?? '').toLowerCase();
      const nextVal = envOptIn === '1' || envOptIn === 'true';
      const shouldUpdate = value === null || value === undefined || value !== nextVal;
      if (shouldUpdate) {
        update[key] = nextVal;
        matches.push({ key, from: value, to: nextVal });
      }
      continue;
    }

    // Heuristic fallback for instances where keys differ (older/newer versions).
    const looksLikeConsent =
      (lower.includes('accepted') ||
        lower.includes('accept') ||
        lower.includes('agree') ||
        lower.includes('consent')) ||
      lower.includes('privacy') ||
      (lower.includes('license') &&
        (lower.includes('accept') || lower.includes('accepted') || lower.includes('agree'))) ||
      lower.includes('bsl_1_1') ||
      (lower.includes('bsl') &&
        (lower.includes('accepted') || lower.includes('accept') || lower.includes('agree') || lower.includes('consent')));

    const looksLikeOwnerEmail =
      lower.includes('owner') && (lower.includes('email') || lower.includes('mail') || lower.includes('contact'));

    const looksLikeUsageText =
      lower.includes('using') ||
      lower.includes('purpose') ||
      lower.includes('what') ||
      lower.includes('usage') ||
      (lower.includes('directus') && lower.includes('for')) ||
      (lower.includes('bsl') && (lower.includes('purpose') || lower.includes('usage') || lower.includes('for')));

    let nextVal = undefined;
    if (looksLikeOwnerEmail) {
      nextVal = DEFAULT_BSL_OWNER_EMAIL;
    } else if (looksLikeUsageText) {
      nextVal = DEFAULT_BSL_USAGE_TEXT;
    } else if (looksLikeConsent) {
      nextVal = typeof value === 'string' ? 'true' : true;
    }

    if (nextVal === undefined) continue;

    const shouldUpdate =
      value === null || value === undefined || value === false || value === '' || String(value) !== String(nextVal);

    if (shouldUpdate) {
      update[key] = nextVal;
      matches.push({ key, from: value, to: nextVal });
    }
  }

  if (DIRECTUS_BSL_DEBUG) {
    const maskedEmail = (s) =>
      typeof s === 'string' && s.includes('@') ? `${s.slice(0, 3)}***${s.slice(s.indexOf('@'))}` : s;
    console.log('--- Directus BSL debug ---');
    console.log('Owner email used:', maskedEmail(DEFAULT_BSL_OWNER_EMAIL));
    console.log('Matched BSL keys:', matches.map((m) => m.key));
    console.log(
      'Matched BSL value sample:',
      matches.slice(0, 10).map((m) => ({ key: m.key, from: maskedEmail(m.from), to: maskedEmail(m.to) })),
    );
    console.log('---------------------------');
  }

  return update;
}

export async function up(client) {
  const allSettingsRaw = await client.request(readSettings());
  const allSettings = Array.isArray(allSettingsRaw) ? allSettingsRaw[0] : allSettingsRaw;
  const bslUpdate = buildBslAutoOwnerUpdateFromSettings(allSettings);

  const safeUpdate = Object.fromEntries(
    Object.entries(bslUpdate).filter(([key]) => key !== 'license_key'),
  );

  if (Object.keys(safeUpdate).length === 0) {
    console.warn('No BSL compliance fields matched from /settings; popup may still appear.');
    return;
  }

  await client.request(updateSettings(safeUpdate));
  console.log(`Updated BSL compliance fields: ${Object.keys(safeUpdate).join(', ')}`);
}

