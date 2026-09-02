import {
  createCollection,
  createField,
  createRelation,
  readItems,
  createItem,
  updateItem,
  updateField,
  updateRelation,
} from '@directus/sdk';
import { ensureUploadedFileFromLocalFilename } from './_helpers.js';

const COLLECTION = 'languages';
const GROUP_COLLECTION = 'settings';

const SEED_LANGUAGES = [
  {
    code: 'hy',
    default: true,
    enable: true,
    flag: '010842da-0d4b-4a5c-a0d5-290ae1fd47b0',
    locale_code: 'hy-am',
    name: 'Հայերեն',
    sort: 1,
  },
  {
    code: 'en',
    default: false,
    enable: true,
    flag: '0af9c2d8-f5de-4b58-881d-16a1bf506b8f',
    locale_code: 'en',
    name: 'English',
    sort: 2,
  },
  {
    code: 'ru',
    default: false,
    enable: true,
    flag: '09a94f6e-628c-46e6-93a8-23a01a42d493',
    locale_code: 'ru-rus',
    name: 'Русский',
    sort: 3,
  },
];

function throwHelpfulForbidden(err, action) {
  const status = err?.response?.status;
  const code = err?.errors?.[0]?.extensions?.code;
  const msg = String(err?.message || err?.errors?.[0]?.message || '');
  const isForbidden =
    status === 403 ||
    code === 'FORBIDDEN' ||
    code === 'UNAUTHORIZED' ||
    msg.toLowerCase().includes("don't have permission") ||
    msg.toLowerCase().includes('permission');

  if (!isForbidden) throw err;

  // Try to show the most useful details we have without dumping secrets.
  const details = [
    status ? `status=${status}` : null,
    code ? `code=${code}` : null,
    msg ? `message=${msg}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  throw new Error(
    `Directus denied permission while trying to ${action}.\n` +
      (details ? `Details: ${details}\n` : '') +
      `This migration creates schema (collection/fields), which requires an admin token or an admin user.\n` +
      `Fix: generate a static admin token in Directus and set DIRECTUS_TOKEN in .migrations/.env (recommended),\n` +
      `or ensure ${process.env.DIRECTUS_EMAIL || 'your migration user'} has an admin role with schema permissions.`,
  );
}

function isForbiddenError(err) {
  const status = err?.response?.status;
  const code = err?.errors?.[0]?.extensions?.code;
  const msg = String(err?.message || err?.errors?.[0]?.message || '').toLowerCase();
  return (
    status === 403 ||
    code === 'FORBIDDEN' ||
    code === 'UNAUTHORIZED' ||
    msg.includes("don't have permission") ||
    msg.includes('permission') ||
    msg.includes('forbidden')
  );
}

function isCollectionNotFound(err) {
  const status = err?.response?.status;
  const code = err?.errors?.[0]?.extensions?.code;
  const msg = String(err?.message || err?.errors?.[0]?.message || '').toLowerCase();
  return status === 404 || code === 'COLLECTION_NOT_FOUND' || msg.includes('collection') && msg.includes('not found');
}

async function ensureCollection(client) {
  try {
    // If the collection already exists, we still continue to ensure schema + seed (idempotent).
    await client.request(() => ({
      path: `/collections/${COLLECTION}`,
      method: 'GET',
    }));
    return 'exists';
  } catch {
    // continue to create
  }

  try {
    await client.request(
      createCollection({
        collection: COLLECTION,
        meta: {
          collection: COLLECTION,
          icon: 'language',
          hidden: false,
          singleton: false,
          sort_field: 'sort',
          accountability: 'all',
          sort: 2,
          // NOTE: `meta.group` is a foreign key to another *collection* in `directus_collections`.
          // We ensure the group collection exists below.
          group: GROUP_COLLECTION,
          collapse: 'open',
          versioning: false,
        },
        schema: {
          schema: 'public',
          name: COLLECTION,
        },
        fields: [
          {
            field: 'id',
            type: 'uuid',
            schema: {
              is_primary_key: true,
              has_auto_increment: false,
            },
            meta: {
              interface: 'input',
              special: ['uuid'],
              hidden: true,
            },
          },
        ],
      }),
    );
  } catch (e) {
    // If it already exists, we're good (common when rerunning).
    const code = e?.errors?.[0]?.extensions?.code;
    const msg = String(e?.message || e?.errors?.[0]?.message || '').toLowerCase();
    if (code === 'COLLECTION_ALREADY_EXISTS' || msg.includes('already exists')) return;
    throwHelpfulForbidden(e, `create the "${COLLECTION}" collection`);
    throw e;
  }

  return 'created';
}

async function ensureSettingsGroupCollection(client) {
  // In Directus, `meta.group` must reference an existing collection key (foreign key).
  // We'll create a hidden grouping collection named "settings" if it's missing.
  try {
    await client.request(() => ({ path: `/collections/${GROUP_COLLECTION}`, method: 'GET' }));
    return;
  } catch {
    // continue to create
  }

  try {
    await client.request(
      createCollection({
        collection: GROUP_COLLECTION,
        meta: {
          collection: GROUP_COLLECTION,
          icon: 'settings',
          hidden: false,
          singleton: false,
          accountability: 'all',
          collapse: 'open',
          note: 'UI grouping collection used as meta.group target for settings collections.',
        },
        schema: {
          schema: 'public',
          name: GROUP_COLLECTION,
        },
        fields: [
          {
            field: 'id',
            type: 'uuid',
            schema: {
              is_primary_key: true,
              has_auto_increment: false,
            },
            meta: {
              interface: 'input',
              special: ['uuid'],
              hidden: true,
            },
          },
        ],
      }),
    );
    console.log(`Created grouping collection: ${GROUP_COLLECTION}`);
  } catch (e) {
    const code = e?.errors?.[0]?.extensions?.code;
    const msg = String(e?.message || e?.errors?.[0]?.message || '').toLowerCase();
    if (code === 'COLLECTION_ALREADY_EXISTS' || msg.includes('already exists')) return;
    throwHelpfulForbidden(e, `create the "${GROUP_COLLECTION}" grouping collection`);
    throw e;
  }
}

async function ensureField(client, field) {
  try {
    await client.request(createField(COLLECTION, field));
  } catch (e) {
    const code = e?.errors?.[0]?.extensions?.code;
    if (code === 'FIELD_ALREADY_EXISTS') return;
    // Some Directus versions return a message without the code
    if (String(e?.message || '').toLowerCase().includes('already exists')) return;
    throwHelpfulForbidden(e, `create the "${COLLECTION}.${field.field}" field`);
    throw e;
  }
}

async function ensureFileRelationField(client) {
  // `flag` should be a proper relation to directus_files so the UI shows file picker + preview.
  // Best-effort upgrade: if the field already exists (e.g. as string), try to update it.
  const field = {
    field: 'flag',
    type: 'uuid',
    schema: {
      is_nullable: true,
      // Note: the actual FK constraint is defined through `directus_relations`.
      // Some Directus versions won't apply FK via `updateField` alone.
    },
    meta: {
      interface: 'file-image',
      special: ['file'],
      display: 'image',
      hidden: false,
      sort: 6,
      note: 'Flag image (Directus file).',
    },
  };

  try {
    await client.request(createField(COLLECTION, field));
    return;
  } catch (e) {
    const code = e?.errors?.[0]?.extensions?.code;
    const msg = String(e?.message || e?.errors?.[0]?.message || '').toLowerCase();
    const alreadyExists = code === 'FIELD_ALREADY_EXISTS' || msg.includes('already exists');
    if (!alreadyExists) {
      throwHelpfulForbidden(e, `create the "${COLLECTION}.flag" file relation field`);
      throw e;
    }
  }

  // Field exists. Try to update its schema/meta to match the file relation.
  try {
    await client.request(
      updateField(COLLECTION, 'flag', {
        schema: field.schema,
        meta: field.meta,
        type: field.type,
      }),
    );
  } catch (e) {
    // Don't fail the whole migration if the field can't be upgraded (e.g. incompatible DB type).
    console.warn(
      `Could not upgrade "${COLLECTION}.flag" to a file relation. ` +
        `If flags don't preview in the UI, update the field manually to a File relation to directus_files.`,
    );
    console.warn(e?.message || e);
  }
}

async function ensureFlagRelation(client) {
  // Ensure an actual many-to-one relation exists so Directus treats this as a real File relation.
  // Without this, the UI can show a file picker, but the DB schema might not have a FK.
  const item = {
    collection: COLLECTION,
    field: 'flag',
    related_collection: 'directus_files',
    meta: {
      // M2O: one side is directus_files, many side is languages
      one_collection: 'directus_files',
      one_field: null,
      one_deselect_action: 'nullify',
    },
    schema: {
      table: COLLECTION,
      column: 'flag',
      foreign_key_table: 'directus_files',
      foreign_key_column: 'id',
      foreign_key_schema: 'public',
      on_delete: 'SET NULL',
      on_update: 'CASCADE',
    },
  };

  try {
    await client.request(createRelation(item));
    return;
  } catch (e) {
    const code = e?.errors?.[0]?.extensions?.code;
    const msg = String(e?.message || e?.errors?.[0]?.message || '').toLowerCase();
    const alreadyExists =
      code === 'RELATIONSHIP_ALREADY_EXISTS' ||
      code === 'RELATION_ALREADY_EXISTS' ||
      msg.includes('already exists');
    if (!alreadyExists) {
      // Some Directus versions require updateRelation instead of createRelation.
      try {
        await client.request(updateRelation(COLLECTION, 'flag', item));
        return;
      } catch {
        throwHelpfulForbidden(e, `create/update the "${COLLECTION}.flag" relation`);
        throw e;
      }
    }
  }
}

async function ensureSchema(client) {
  // Minimal fields needed for your seed data.
  // Note: `default` is a reserved word in JS, but valid as a field name in Directus.
  await ensureField(client, {
    field: 'code',
    type: 'string',
    schema: { is_nullable: false, is_unique: true },
    meta: { required: true, interface: 'input' },
  });

  await ensureField(client, {
    field: 'name',
    type: 'string',
    schema: { is_nullable: false },
    meta: { required: true, interface: 'input' },
  });

  await ensureField(client, {
    field: 'locale_code',
    type: 'string',
    schema: { is_nullable: true },
    meta: { interface: 'input' },
  });

  await ensureField(client, {
    field: 'enable',
    type: 'boolean',
    schema: { is_nullable: false, default_value: true },
    meta: { interface: 'boolean', required: true },
  });

  await ensureField(client, {
    field: 'default',
    type: 'boolean',
    schema: { is_nullable: false, default_value: false },
    meta: { interface: 'boolean', required: true },
  });

  await ensureField(client, {
    field: 'sort',
    type: 'integer',
    schema: { is_nullable: true },
    meta: { interface: 'input' },
  });

  await ensureFileRelationField(client);
  await ensureFlagRelation(client);
}

async function upsertLanguage(client, lang) {
  // Flag linking strategy:
  // - The value stored in languages.flag must be the real directus_files.id (UUID).
  // - The UUID filename in directus/uploads/<uuid>.svg is NOT necessarily the same as directus_files.id.
  // So we reuse/upload by filename, then store the returned file record id.
  const filename = lang.flag ? `${lang.flag}.svg` : '';
  const flagFileId = filename ? await ensureUploadedFileFromLocalFilename(client, filename) : null;
  const payload = { ...lang, flag: flagFileId };

  let existing;
  try {
    existing = await client.request(
      readItems(COLLECTION, {
        filter: { code: { _eq: lang.code } },
        limit: 1,
        fields: ['id', 'code'],
      }),
    );
  } catch (e) {
    throwHelpfulForbidden(e, `read items from "${COLLECTION}"`);
  }
  const row = existing?.[0] ?? null;

  if (!row?.id) {
    try {
      await client.request(createItem(COLLECTION, payload));
    } catch (e) {
      throwHelpfulForbidden(e, `create items in "${COLLECTION}"`);
    }
    return 'created';
  }

  try {
    await client.request(updateItem(COLLECTION, row.id, payload));
  } catch (e) {
    throwHelpfulForbidden(e, `update items in "${COLLECTION}"`);
  }
  return 'updated';
}

async function ensureLanguagesTabularPreset(client) {
  // Ensure the Directus Content -> Languages list shows `flag` by default.
  // In this Directus setup, tabular columns are stored as:
  //   layout: null
  //   layout_query: { tabular: { fields: [...] } }
  //
  // We upsert both a global preset and user presets (so it applies immediately per-user).
  const desiredFields = ['code', 'enable', 'locale_code', 'name', 'flag'];

  async function requestJson(method, path, body) {
    return await client.request(() => ({
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }));
  }

  async function getPresets(filter, limit = 1) {
    const res = await client.request(() => ({
      path: '/presets',
      method: 'GET',
      params: {
        filter: { collection: { _eq: COLLECTION }, ...filter },
        limit,
        fields: ['id', 'layout', 'user', 'role', 'layout_query'],
      },
    }));
    return Array.isArray(res?.data) ? res.data : [];
  }

  async function upsertPreset({ userId = null } = {}) {
    const filter = {
      layout: { _null: true },
      role: { _null: true },
      ...(userId ? { user: { _eq: userId } } : { user: { _null: true } }),
    };

    const rows = await getPresets(filter, 1);
    const row = rows?.[0] ?? null;
    const current = row?.layout_query?.tabular?.fields;
    const nextFields = Array.isArray(current)
      ? Array.from(new Set([...current, ...desiredFields]))
      : desiredFields;

    const payload = {
      collection: COLLECTION,
      layout: null,
      user: userId,
      role: null,
      layout_query: {
        ...(row?.layout_query || {}),
        tabular: {
          ...((row?.layout_query || {})?.tabular || {}),
          fields: nextFields,
        },
      },
      layout_options: null,
    };

    if (row?.id) {
      await requestJson('PATCH', `/presets/${row.id}`, payload);
      return 'updated';
    }

    await requestJson('POST', '/presets', payload);
    return 'created';
  }

  try {
    // Global preset
    await upsertPreset({ userId: null });

    // Per-user presets
    const usersRes = await client.request(() => ({
      path: '/users',
      method: 'GET',
      params: { limit: -1, fields: ['id'] },
    }));
    const users = Array.isArray(usersRes?.data) ? usersRes.data : [];
    for (const u of users) {
      const userId = u?.id;
      if (!userId) continue;
      try {
        await upsertPreset({ userId });
      } catch {
        // ignore per-user failures
      }
    }
  } catch (e) {
    // Non-fatal: presets/users endpoints might be restricted.
    console.warn(`Could not ensure presets for "${COLLECTION}" tabular view (non-fatal).`);
    console.warn(e?.message || e);
  }
}

export async function up(client) {
  try {
    await ensureSettingsGroupCollection(client);
    const collectionStatus = await ensureCollection(client);
    await ensureSchema(client);

    const results = [];
    for (const lang of SEED_LANGUAGES) {
      const status = await upsertLanguage(client, lang);
      results.push(`${lang.code}:${status}`);
    }

    await ensureLanguagesTabularPreset(client);
    console.log(`Languages ready (${COLLECTION}): ${results.join(', ')}`);
  } catch (e) {
    // Only attempt seed-only fallback when the schema step failed due to permissions.
    if (!isForbiddenError(e)) throw e;

    // Seed-only fallback without schema calls:
    // Many roles can't access schema endpoints (`readCollection` / `createCollection` / `createField`),
    // but can still read/write items once the collection exists.
    try {
      console.warn(
        `No permission to create/update schema for "${COLLECTION}". Trying seed-only (collection must already exist).`,
      );
      const results = [];
      for (const lang of SEED_LANGUAGES) {
        const status = await upsertLanguage(client, lang);
        results.push(`${lang.code}:${status}`);
      }
      await ensureLanguagesTabularPreset(client);
      console.log(`Languages ready (${COLLECTION}) [seed-only]: ${results.join(', ')}`);
      return;
    } catch (seedErr) {
      if (isCollectionNotFound(seedErr)) {
        throw new Error(
          `Cannot seed "${COLLECTION}" because the collection doesn't exist yet.\n` +
            `You need an admin token/role to create the collection + fields (schema).\n` +
            `Fix: run migrations with a true admin DIRECTUS_TOKEN, or create the "${COLLECTION}" collection manually in Directus UI and rerun.`,
        );
      }
      // If it's forbidden or other, fall through to helpful forbidden handler.
      e = seedErr;
    }

    // Catch any remaining forbidden shapes and rethrow a clear message.
    throwHelpfulForbidden(e, `apply "${COLLECTION}" schema + seed`);
    throw e;
  }
}

