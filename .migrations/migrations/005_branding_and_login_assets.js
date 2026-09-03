import { readSettings, updateSettings } from '@directus/sdk';
import { ensureUploadedFileId } from './_helpers.js';

const TARGET_PROJECT_COLOR = process.env.DEFAULT_PROJECT_COLOR || '#355C8C';
const TARGET_PROJECT_NAME = process.env.DEFAULT_PROJECT_NAME || 'Narek Elen';
// Desired project logo (SVG file id under `directus/uploads/<id>.svg`)
const TARGET_PROJECT_LOGO_ID = '85ec1ef8-805e-4c70-8354-c897d3565181';

// Keep login animation/background untouched by default.
// Use foreground for a small image on the login screen.
const TARGET_LOGIN_BACKGROUND_ID = process.env.DIRECTUS_LOGIN_BACKGROUND_FILE_ID || '';
const TARGET_LOGIN_FOREGROUND_ID =
  process.env.DIRECTUS_LOGIN_FOREGROUND_FILE_ID || '85ec1ef8-805e-4c70-8354-c897d3565181';

export async function up(client) {
  const current = await client.request(
    readSettings({
      fields: [
        'project_color',
        'project_name',
        'project_logo',
        'public_background',
        'public_foreground',
        'default_appearance',
        'default_theme_light',
        'default_theme_dark',
      ],
    }),
  );

  const currentSettings = Array.isArray(current) ? current[0] : current;
  const currentColor = currentSettings?.project_color;
  const currentName = currentSettings?.project_name;
  const currentLogoId = currentSettings?.project_logo;
  const currentLoginBackground = currentSettings?.public_background;
  const currentLoginForeground = currentSettings?.public_foreground;

  const updatePayload = {
    // Keep appearance/theme defaults stable
    default_appearance: currentSettings?.default_appearance ?? 'light',
    default_theme_light: currentSettings?.default_theme_light ?? 'Directus Default',
    default_theme_dark: currentSettings?.default_theme_dark ?? 'Directus Default',
  };

  const needsProjectColor = currentColor !== TARGET_PROJECT_COLOR;
  const needsProjectName = currentName !== TARGET_PROJECT_NAME;
  const needsProjectLogo = currentLogoId !== TARGET_PROJECT_LOGO_ID;

  if (needsProjectColor || needsProjectName || needsProjectLogo) {
    updatePayload.project_name = TARGET_PROJECT_NAME;
    updatePayload.project_color = TARGET_PROJECT_COLOR;
    updatePayload.project_logo = await ensureUploadedFileId(client, TARGET_PROJECT_LOGO_ID);
  }

  if (TARGET_LOGIN_BACKGROUND_ID) {
    if (currentLoginBackground !== TARGET_LOGIN_BACKGROUND_ID) {
      updatePayload.public_background = await ensureUploadedFileId(client, TARGET_LOGIN_BACKGROUND_ID);
    }
  } else if (currentLoginBackground) {
    // Explicitly clear background so Directus keeps the animated/default login background.
    updatePayload.public_background = null;
  }

  if (TARGET_LOGIN_FOREGROUND_ID && currentLoginForeground !== TARGET_LOGIN_FOREGROUND_ID) {
    updatePayload.public_foreground = await ensureUploadedFileId(client, TARGET_LOGIN_FOREGROUND_ID);
  }

  if (Object.keys(updatePayload).length === 0) return;

  await client.request(updateSettings(updatePayload));

  console.log(
    `Updated Directus branding/login assets. project_name=${TARGET_PROJECT_NAME}, project_color=${TARGET_PROJECT_COLOR}, project_logo=${TARGET_PROJECT_LOGO_ID}, public_background=${TARGET_LOGIN_BACKGROUND_ID || '(unchanged)'}, public_foreground=${TARGET_LOGIN_FOREGROUND_ID || '(unchanged)'}`,
  );
}

