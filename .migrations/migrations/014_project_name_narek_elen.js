import { readSettings, updateSettings } from '@directus/sdk';

const TARGET_PROJECT_NAME = process.env.DEFAULT_PROJECT_NAME || 'Narek Elen';

export async function up(client) {
  const current = await client.request(
    readSettings({
      fields: ['project_name'],
    }),
  );

  const currentSettings = Array.isArray(current) ? current[0] : current;
  if (currentSettings?.project_name === TARGET_PROJECT_NAME) {
    console.log(`project_name already set to "${TARGET_PROJECT_NAME}"`);
    return;
  }

  await client.request(
    updateSettings({
      project_name: TARGET_PROJECT_NAME,
    }),
  );

  console.log(`Updated Directus project_name to "${TARGET_PROJECT_NAME}"`);
}
