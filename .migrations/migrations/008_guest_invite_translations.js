import {
  createCollection,
  createField,
  createRelation,
  readItems,
  createItem,
  updateItem,
  updateRelation,
} from '@directus/sdk';

const COLLECTION = 'guest_invite_translations';
const LANGUAGES_COLLECTION = 'languages';
const GROUP_COLLECTION = 'settings';

const SEED_TRANSLATIONS = {
  hy: {
    title: 'Հարգելի՛ հյուրեր',
    body:
      'Այս տարվա օրերից մեկը մեզ համար առանձնահատուկ է լինելու, և մենք ցանկանում ենք այն անցկացնել մեր հարազատների ու ընկերների շրջապատում։ Մեծ սիրով հրավիրում ենք ձեզ ամենահուզիչ տոնին՝ մեր հարսանիքին։',
  },
  en: {
    title: 'Dear guests',
    body:
      'One of the days this year will be special for us, and we want to spend it surrounded by our relatives and friends. With great love, we invite you to the most exciting celebration — our wedding.',
  },
  ru: {
    title: 'Дорогие гости',
    body:
      'Один из дней этого года будет особенным для нас, и мы хотим провести его в окружении наших родных и друзей. С большой любовью приглашаем вас на самый волнующий праздник — нашу свадьбу.',
  },
};

function throwHelpfulForbidden(err, action) {
  const msg = String(err?.message || err?.errors?.[0]?.message || '');

  throw new Error(
    `Directus denied permission while trying to ${action}.\n` +
      (msg ? `Details: ${msg}\n` : '') +
      `Run migrations with an admin DIRECTUS_TOKEN or admin email/password in .migrations/.env`,
  );
}

async function ensureCollection(client) {
  try {
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
          icon: 'mail',
          hidden: false,
          singleton: false,
          accountability: 'all',
          collapse: 'open',
          group: GROUP_COLLECTION,
          note: 'Guest invitation section title and body per language',
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
    return 'created';
  } catch (e) {
    const code = e?.errors?.[0]?.extensions?.code;
    const msg = String(e?.message || e?.errors?.[0]?.message || '').toLowerCase();
    if (code === 'COLLECTION_ALREADY_EXISTS' || msg.includes('already exists')) return 'exists';
    throwHelpfulForbidden(e, `create the "${COLLECTION}" collection`);
    throw e;
  }
}

async function ensureField(client, field) {
  try {
    await client.request(createField(COLLECTION, field));
  } catch (e) {
    const code = e?.errors?.[0]?.extensions?.code;
    if (code === 'FIELD_ALREADY_EXISTS') return;
    if (String(e?.message || '').toLowerCase().includes('already exists')) return;
    throwHelpfulForbidden(e, `create the "${COLLECTION}.${field.field}" field`);
    throw e;
  }
}

async function ensureLanguageRelation(client) {
  await ensureField(client, {
    field: 'language',
    type: 'uuid',
    schema: { is_nullable: false, is_unique: true },
    meta: {
      required: true,
      interface: 'select-dropdown-m2o',
      special: ['m2o'],
      display: 'related-values',
      display_options: { template: '{{name}} ({{code}})' },
      sort: 1,
      note: 'Language for this guest invitation text',
    },
  });

  const relation = {
    collection: COLLECTION,
    field: 'language',
    related_collection: LANGUAGES_COLLECTION,
    meta: {
      one_collection: LANGUAGES_COLLECTION,
      one_field: null,
      one_deselect_action: 'nullify',
    },
    schema: {
      table: COLLECTION,
      column: 'language',
      foreign_key_table: LANGUAGES_COLLECTION,
      foreign_key_column: 'id',
      foreign_key_schema: 'public',
      on_delete: 'CASCADE',
      on_update: 'CASCADE',
    },
  };

  try {
    await client.request(createRelation(relation));
  } catch (e) {
    const code = e?.errors?.[0]?.extensions?.code;
    const msg = String(e?.message || e?.errors?.[0]?.message || '').toLowerCase();
    const alreadyExists =
      code === 'RELATIONSHIP_ALREADY_EXISTS' ||
      code === 'RELATION_ALREADY_EXISTS' ||
      msg.includes('already exists');
    if (!alreadyExists) {
      try {
        await client.request(updateRelation(COLLECTION, 'language', relation));
      } catch {
        throwHelpfulForbidden(e, `create/update the "${COLLECTION}.language" relation`);
        throw e;
      }
    }
  }
}

async function ensureSchema(client) {
  await ensureLanguageRelation(client);

  await ensureField(client, {
    field: 'title',
    type: 'string',
    schema: { is_nullable: false },
    meta: {
      required: true,
      interface: 'input',
      sort: 2,
      width: 'full',
      note: 'Section heading, e.g. "Dear guests"',
    },
  });

  await ensureField(client, {
    field: 'body',
    type: 'text',
    schema: { is_nullable: false },
    meta: {
      required: true,
      interface: 'input-multiline',
      sort: 3,
      width: 'full',
      note: 'Invitation paragraph text',
    },
  });
}

async function getLanguageIdByCode(client, code) {
  const rows = await client.request(
    readItems(LANGUAGES_COLLECTION, {
      filter: { code: { _eq: code } },
      limit: 1,
      fields: ['id', 'code'],
    }),
  );
  return rows?.[0]?.id ?? null;
}

async function upsertTranslation(client, code, translations) {
  const languageId = await getLanguageIdByCode(client, code);
  if (!languageId) {
    console.warn(`Language "${code}" not found; skipping guest invite translation seed.`);
    return 'skipped';
  }

  const payload = { language: languageId, ...translations };

  const existing = await client.request(
    readItems(COLLECTION, {
      filter: { language: { _eq: languageId } },
      limit: 1,
      fields: ['id'],
    }),
  );

  const row = existing?.[0] ?? null;
  if (!row?.id) {
    await client.request(createItem(COLLECTION, payload));
    return 'created';
  }

  await client.request(updateItem(COLLECTION, row.id, payload));
  return 'updated';
}

async function getPublicPolicyId(client) {
  const policiesRes = await client.request(() => ({
    path: '/policies',
    method: 'GET',
    params: {
      limit: -1,
      fields: ['id', 'name', 'admin_access', 'app_access', 'icon'],
    },
  }));

  const policies = Array.isArray(policiesRes?.data)
    ? policiesRes.data
    : Array.isArray(policiesRes)
      ? policiesRes
      : [];

  const policy =
    policies.find((item) => item.icon === 'public') ||
    policies.find((item) => item.admin_access === false && item.app_access === false);

  if (!policy?.id) {
    throw new Error('Public policy not found in Directus');
  }

  return policy.id;
}

async function ensurePublicReadPermission(client, collectionName) {
  const policyId = await getPublicPolicyId(client);

  try {
    const existing = await client.request(() => ({
      path: '/permissions',
      method: 'GET',
      params: {
        filter: {
          policy: { _eq: policyId },
          collection: { _eq: collectionName },
          action: { _eq: 'read' },
        },
        limit: 1,
        fields: ['id'],
      },
    }));

    if (existing?.data?.length) return 'exists';
  } catch {
    // continue to create
  }

  await client.request(() => ({
    path: '/permissions',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      policy: policyId,
      collection: collectionName,
      action: 'read',
      permissions: {},
      validation: {},
      presets: null,
      fields: ['*'],
    }),
  }));

  return 'created';
}

export async function up(client) {
  const collectionStatus = await ensureCollection(client);
  await ensureSchema(client);

  const results = [];
  for (const [code, translations] of Object.entries(SEED_TRANSLATIONS)) {
    const status = await upsertTranslation(client, code, translations);
    results.push(`${code}:${status}`);
  }

  const guestInviteRead = await ensurePublicReadPermission(client, COLLECTION);

  console.log(
    `Guest invite translations ready (${COLLECTION}): collection=${collectionStatus}, seed=[${results.join(', ')}], public_read=${guestInviteRead}`,
  );
}
