import { createCollection, createField, readItems, updateSingleton } from '@directus/sdk';

const COLLECTION = 'guest_totals';

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
          icon: 'groups',
          hidden: false,
          singleton: true,
          accountability: 'all',
          collapse: 'open',
          note: 'Auto-calculated RSVP guest totals',
          versioning: false,
        },
        schema: {
          schema: 'public',
          name: COLLECTION,
        },
        fields: [
          {
            field: 'id',
            type: 'integer',
            schema: {
              is_primary_key: true,
              has_auto_increment: true,
            },
            meta: {
              interface: 'input',
              hidden: true,
              readonly: true,
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
    field: 'total_guests',
    type: 'integer',
    schema: { is_nullable: false, default_value: 0 },
    meta: {
      required: true,
      interface: 'input',
      readonly: true,
      sort: 1,
      width: 'half',
      note: 'Sum of guest_count for attending RSVPs',
    },
  });

  await ensureField(client, {
    field: 'total_attending',
    type: 'integer',
    schema: { is_nullable: false, default_value: 0 },
    meta: {
      required: true,
      interface: 'input',
      readonly: true,
      sort: 2,
      width: 'half',
      note: 'Number of RSVPs with attending = true',
    },
  });

  await ensureField(client, {
    field: 'total_declined',
    type: 'integer',
    schema: { is_nullable: false, default_value: 0 },
    meta: {
      required: true,
      interface: 'input',
      readonly: true,
      sort: 3,
      width: 'half',
      note: 'Number of RSVPs with attending = false',
    },
  });
}

export async function calculateGuestTotals(client) {
  const rows = await client.request(
    readItems('rsvp', {
      limit: -1,
      fields: ['guest_count', 'attending'],
    }),
  );

  let totalGuests = 0;
  let totalAttending = 0;
  let totalDeclined = 0;

  for (const row of rows) {
    if (row.attending) {
      totalAttending += 1;
      totalGuests += Number(row.guest_count) || 0;
    } else {
      totalDeclined += 1;
    }
  }

  await client.request(
    updateSingleton(COLLECTION, {
      total_guests: totalGuests,
      total_attending: totalAttending,
      total_declined: totalDeclined,
    }),
  );

  return { totalGuests, totalAttending, totalDeclined };
}

export async function up(client) {
  const collectionStatus = await ensureCollection(client);
  await ensureSchema(client);
  const totals = await calculateGuestTotals(client);

  console.log(
    `Guest totals ready (${COLLECTION}): collection=${collectionStatus}, total_guests=${totals.totalGuests}, total_attending=${totals.totalAttending}, total_declined=${totals.totalDeclined}`,
  );
}
