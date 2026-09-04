import { createField } from '@directus/sdk';

const COLLECTION = 'rsvp';
const RSVP_PUBLIC_FIELDS = ['*'];

function isRestrictedError(err) {
  const msg = String(err?.message || err?.errors?.[0]?.message || '').toLowerCase();
  return (
    msg.includes('restricted') ||
    msg.includes('forbidden') ||
    msg.includes('custom_permission_rules_enabled')
  );
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

async function ensureIpField(client) {
  try {
    await client.request(
      createField(COLLECTION, {
        field: 'ip',
        type: 'string',
        schema: { is_nullable: true, max_length: 64 },
        meta: {
          required: false,
          interface: 'input',
          sort: 5,
          width: 'half',
          note: 'Client IP used to prevent duplicate RSVP rows',
        },
      }),
    );
    return 'created';
  } catch (e) {
    const code = e?.errors?.[0]?.extensions?.code;
    if (code === 'FIELD_ALREADY_EXISTS') return 'exists';
    if (String(e?.message || '').toLowerCase().includes('already exists')) return 'exists';
    throw e;
  }
}

async function findPublicPermission(client, policyId, action) {
  try {
    const existing = await client.request(() => ({
      path: '/permissions',
      method: 'GET',
      params: {
        filter: {
          policy: { _eq: policyId },
          collection: { _eq: COLLECTION },
          action: { _eq: action },
        },
        limit: 1,
        fields: ['id', 'fields'],
      },
    }));
    return existing?.data?.[0] ?? null;
  } catch {
    return null;
  }
}

async function ensurePublicPermission(client, action) {
  try {
    const policyId = await getPublicPolicyId(client);
    const existing = await findPublicPermission(client, policyId, action);

    // Directus requires permissions/validation as {} (not null) for public policies.
    const body = {
      fields: RSVP_PUBLIC_FIELDS,
      permissions: {},
      validation: {},
    };

    if (existing?.id) {
      try {
        await client.request(() => ({
          path: `/permissions/${existing.id}`,
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }));
        return 'updated';
      } catch (e) {
        if (isRestrictedError(e)) return 'manual_required';
        throw e;
      }
    }

    await client.request(() => ({
      path: '/permissions',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        policy: policyId,
        collection: COLLECTION,
        action,
        ...body,
      }),
    }));

    return 'created';
  } catch (e) {
    if (isRestrictedError(e)) return 'manual_required';
    throw e;
  }
}

export async function up(client) {
  const fieldStatus = await ensureIpField(client);
  const readStatus = await ensurePublicPermission(client, 'read');
  const updateStatus = await ensurePublicPermission(client, 'update');

  console.log(
    `RSVP IP ready (${COLLECTION}): ip_field=${fieldStatus}, public_read=${readStatus}, public_update=${updateStatus}`,
  );

  if (readStatus === 'manual_required' || updateStatus === 'manual_required') {
    console.warn(
      `API cannot change Public permissions (restricted). If read/update still fail, run locally:\n` +
        `  docker exec sam-inna-postgres psql -U directus -d directus -c "INSERT INTO ..."\n` +
        `Or in Admin → Access Control → Public → rsvp enable Read + Update (fields *).`,
    );
  }
}
