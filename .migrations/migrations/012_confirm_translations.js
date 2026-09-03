import {
  createCollection,
  createField,
  createRelation,
  readItems,
  createItem,
  updateItem,
  updateRelation,
} from '@directus/sdk';

const COLLECTION = 'confirm_translations';
const LANGUAGES_COLLECTION = 'languages';
const GROUP_COLLECTION = 'settings';

const STRING_FIELDS = [
  'title',
  'placeholder_name',
  'placeholder_surname',
  'placeholder_guests',
  'attendance_question',
  'attend_yes',
  'attend_no',
  'submit',
  'name_hint',
];

const TEXT_FIELDS = [
  'intro',
  'deadline',
  'already_confirmed',
  'error_name',
  'error_count',
  'error_send',
];

const SEED_TRANSLATIONS = {
  hy: {
    title: 'R S V P',
    intro:
      'Ձեր մասնակցությունը մեզ համար շատ կարևոր է, խնդրում ենք լրացնել այս ձևը ձեր պատասխանով։',
    deadline: 'Ձեր պատասխանին կսպասենք մինչև 01.01.2026',
    already_confirmed: 'Դուք արդեն հաստատել եք ձեր մասնակցությունը',
    placeholder_name: 'անուն',
    placeholder_surname: 'ազգանուն',
    placeholder_guests: 'հյուրերի քանակ',
    attendance_question: 'Խնդրում ենք նշել ձեր մասնակցության հնարավորությունը',
    attend_yes: 'Ուրախությամբ կմասնակցեմ',
    attend_no: 'Ցավոք, չեմ կարողանա մասնակցել',
    submit: 'Ուղարկել',
    name_hint: 'Միայն տառեր, առանց բացատի',
    error_name: 'Անունը և ազգանունը պետք է լինեն միայն տառերով և մեկ բառով',
    error_count: 'Լրացրեք հյուրերի ճիշտ քանակը՝ 1-99։',
    error_send: 'Չհաջողվեց ուղարկել RSVP',
  },
  en: {
    title: 'R S V P',
    intro:
      'Your participation is very important to us, so please fill out this form with your response.',
    deadline: 'We will be waiting for your reply until 01.01.2026',
    already_confirmed: 'You have already confirmed your participation',
    placeholder_name: 'name',
    placeholder_surname: 'surname',
    placeholder_guests: 'number of guests',
    attendance_question: 'Please indicate your attendance availability',
    attend_yes: 'I will gladly attend',
    attend_no: "Unfortunately, I won't be able to attend",
    submit: 'Send',
    name_hint: 'Only letters, without spaces',
    error_name: 'The name and the surname must include only letters and consist of one word',
    error_count: 'Fill in the right number of guests: 1-99.',
    error_send: 'Failed to send RSVP',
  },
  ru: {
    title: 'R S V P',
    intro:
      'Ваше участие очень важно для нас, поэтому, пожалуйста, заполните эту форму со своим ответом.',
    deadline: 'Мы будем ждать ваш ответ до 01.01.2026',
    already_confirmed: 'Вы уже подтвердили своё участие',
    placeholder_name: 'имя',
    placeholder_surname: 'фамилия',
    placeholder_guests: 'количество гостей',
    attendance_question: 'Пожалуйста, укажите, сможете ли вы присутствовать',
    attend_yes: 'С радостью буду присутствовать',
    attend_no: 'К сожалению, не смогу присутствовать',
    submit: 'Отправить',
    name_hint: 'Только буквы, без пробелов',
    error_name: 'Имя и фамилия должны состоять только из букв и быть одним словом',
    error_count: 'Укажите правильное количество гостей: 1-99.',
    error_send: 'Не удалось отправить RSVP',
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
          icon: 'how_to_reg',
          hidden: false,
          singleton: false,
          accountability: 'all',
          collapse: 'open',
          group: GROUP_COLLECTION,
          note: 'RSVP / confirm section texts per language',
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
      note: 'Language for this RSVP text',
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

  let sort = 2;
  for (const fieldName of STRING_FIELDS) {
    await ensureField(client, {
      field: fieldName,
      type: 'string',
      schema: { is_nullable: false },
      meta: {
        required: true,
        interface: 'input',
        sort: sort++,
        width: 'full',
      },
    });
  }

  for (const fieldName of TEXT_FIELDS) {
    await ensureField(client, {
      field: fieldName,
      type: 'text',
      schema: { is_nullable: false },
      meta: {
        required: true,
        interface: 'input-multiline',
        sort: sort++,
        width: 'full',
      },
    });
  }
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
    console.warn(`Language "${code}" not found; skipping confirm translation seed.`);
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

  const confirmRead = await ensurePublicReadPermission(client, COLLECTION);

  console.log(
    `Confirm translations ready (${COLLECTION}): collection=${collectionStatus}, seed=[${results.join(', ')}], public_read=${confirmRead}`,
  );
}
