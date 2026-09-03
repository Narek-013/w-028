const COLLECTION = 'rsvp';

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

async function ensurePublicReadPermission(client) {
  const policyId = await getPublicPolicyId(client);

  try {
    const existing = await client.request(() => ({
      path: '/permissions',
      method: 'GET',
      params: {
        filter: {
          policy: { _eq: policyId },
          collection: { _eq: COLLECTION },
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

  try {
    await client.request(() => ({
      path: '/permissions',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        policy: policyId,
        collection: COLLECTION,
        action: 'read',
        permissions: {},
        validation: {},
        presets: null,
        fields: ['id', 'name', 'last_name', 'attending', 'guest_count'],
      }),
    }));
    return 'created';
  } catch (e) {
    const msg = String(e?.message || e?.errors?.[0]?.message || '');
    if (msg.toLowerCase().includes('restricted') || msg.toLowerCase().includes('forbidden')) {
      console.warn(
        `Could not auto-create public read for "${COLLECTION}" (${msg}).\n` +
          `Manual step: Directus → Settings → Access Control → Public → ${COLLECTION} → enable Read ` +
          `(fields: id, name, last_name, attending, guest_count).`,
      );
      return 'manual_required';
    }
    throw e;
  }
}

export async function up(client) {
  const permissionStatus = await ensurePublicReadPermission(client);
  console.log(`RSVP public read ready (${COLLECTION}): public_read=${permissionStatus}`);
}
