import { createCollection, createField } from '@directus/sdk';

const COLLECTION = 'rsvp';

function throwHelpfulForbidden(err, action) {
  const status = err?.response?.status;
  const code = err?.errors?.[0]?.extensions?.code;
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
          icon: 'event_available',
          hidden: false,
          singleton: false,
          accountability: 'all',
          collapse: 'open',
          display_template: '{{name}} {{last_name}}',
          note: 'Wedding RSVP responses',
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

async function ensureSchema(client) {
  await ensureField(client, {
    field: 'name',
    type: 'string',
    schema: { is_nullable: false },
    meta: { required: true, interface: 'input', sort: 1, width: 'half' },
  });

  await ensureField(client, {
    field: 'last_name',
    type: 'string',
    schema: { is_nullable: false },
    meta: { required: true, interface: 'input', sort: 2, width: 'half' },
  });

  await ensureField(client, {
    field: 'attending',
    type: 'boolean',
    schema: { is_nullable: false, default_value: true },
    meta: { required: true, interface: 'boolean', sort: 3, width: 'half' },
  });

  await ensureField(client, {
    field: 'guest_count',
    type: 'integer',
    schema: { is_nullable: true },
    meta: { required: false, interface: 'input', sort: 4, width: 'half' },
  });
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

async function ensurePublicCreatePermission(client) {
  const policyId = await getPublicPolicyId(client);

  try {
    const existing = await client.request(() => ({
      path: '/permissions',
      method: 'GET',
      params: {
        filter: {
          policy: { _eq: policyId },
          collection: { _eq: COLLECTION },
          action: { _eq: 'create' },
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
      collection: COLLECTION,
      action: 'create',
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
  const permissionStatus = await ensurePublicCreatePermission(client);

  console.log(
    `RSVP ready (${COLLECTION}): collection=${collectionStatus}, public_create=${permissionStatus}`,
  );
}
