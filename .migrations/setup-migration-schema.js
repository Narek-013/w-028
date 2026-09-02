import {
  createDirectus,
  rest,
  staticToken,
  createCollection,
  createField,
  readMe,
  login,
} from '@directus/sdk';
import 'dotenv/config';

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
const DIRECTUS_EMAIL = process.env.DIRECTUS_EMAIL;
const DIRECTUS_PASSWORD = process.env.DIRECTUS_PASSWORD;

// Debug: helps detect wrong env loading or stale/invalid token format.
console.log('--- migration auth debug ---');
console.log('cwd:', process.cwd());
console.log('DIRECTUS_URL:', DIRECTUS_URL);
console.log('DIRECTUS_TOKEN_length:', DIRECTUS_TOKEN?.length ?? 0);
console.log('DIRECTUS_TOKEN_prefix:', (DIRECTUS_TOKEN ?? '').slice(0, 6));
console.log('DIRECTUS_EMAIL_set:', !!DIRECTUS_EMAIL);
console.log('--------------------------------');

if (!DIRECTUS_URL) {
  console.error('Error: DIRECTUS_URL must be set in environment variables');
  process.exit(1);
}

function buildClientWithToken(token) {
  return createDirectus(DIRECTUS_URL).with(staticToken(token)).with(rest());
}

async function buildAuthedClient() {
  // 1) Try static token first (if present).
  if (DIRECTUS_TOKEN) {
    try {
      const tokenClient = buildClientWithToken(DIRECTUS_TOKEN);
      const me = await tokenClient.request(readMe({ fields: ['id', 'email'] }));
      console.log(`Directus auth OK (token): me.email=${me?.email ?? '(unknown)'}`);
      return tokenClient;
    } catch (e) {
      console.warn('Directus token auth failed; will try login via email/password if provided.');
      console.warn(e?.message || e);
    }
  }

  // 2) Fallback to login via email/password.
  if (DIRECTUS_EMAIL && DIRECTUS_PASSWORD) {
    const baseClient = createDirectus(DIRECTUS_URL).with(rest());
    const authData = await baseClient.request(
      login({ email: DIRECTUS_EMAIL, password: DIRECTUS_PASSWORD }, { mode: 'json' }),
    );
    if (!authData?.access_token) {
      throw new Error('Directus login did not return an access_token.');
    }

    const authedClient = buildClientWithToken(authData.access_token);
    const me = await authedClient.request(readMe({ fields: ['id', 'email'] }));
    console.log(`Directus auth OK (login): me.email=${me?.email ?? '(unknown)'}`);
    return authedClient;
  }

  throw new Error(
    'Directus authentication failed. Provide either DIRECTUS_TOKEN OR DIRECTUS_EMAIL + DIRECTUS_PASSWORD in .migrations/.env',
  );
}

async function ensureMigrationCollection() {
  const client = await buildAuthedClient();
  try {
    // Check if collection exists
    let collectionExists = false;
    try {
      const collections = await client.request(({ collections }) =>
        collections.readByQuery({ filter: { collection: { _eq: 'schema_migrations' } } })
      );
      if (collections?.data?.length > 0) collectionExists = true;
    } catch (err) {
      // Fallback for older SDK versions, do nothing, will try to create if not found
      collectionExists = false;
    }

    if (!collectionExists) {
      try {
        await client.request(
          createCollection({
            collection: 'schema_migrations',
            schema: {},
            meta: {
              icon: 'schema',
              note: 'Tracks applied migrations',
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
          })
        );
        console.log('Collection "schema_migrations" created with UUID primary key.');
      } catch (err) {
        // If collection was created in the meantime, ignore error
        if (
          err?.errors?.some(
            (e) =>
              e?.message?.toLowerCase().includes('already exists') ||
              e?.extensions?.code === 'COLLECTION_ALREADY_EXISTS'
          )
        ) {
          console.log('Collection "schema_migrations" already exists.');
        } else {
          throw err;
        }
      }
    } else {
      console.log('Collection "schema_migrations" already exists.');
    }

    const extraFields = [
      {
        field: 'filename',
        type: 'string',
        schema: { is_nullable: false, is_unique: true },
        meta: { required: true, interface: 'input', display: 'Migration Filename' },
      },
      {
        field: 'applied_at',
        type: 'timestamp',
        schema: { is_nullable: false },
        meta: { required: true, interface: 'datetime', display: 'Applied At' },
      },
    ];

    for (const field of extraFields) {
      try {
        await client.request(createField('schema_migrations', field));
        console.log(`Field "${field.field}" created`);
      } catch (err) {
        if (err?.errors?.[0]?.extensions?.code === 'FIELD_ALREADY_EXISTS' ||
            err?.errors?.some(e =>
              e?.message?.toLowerCase().includes('already exists') ||
              e?.extensions?.code === 'FIELD_ALREADY_EXISTS'
            )) {
          console.log(`Field "${field.field}" already exists.`);
        } else {
          throw err;
        }
      }
    }

    console.log('"schema_migrations" collection is ready!');
  } catch (error) {
    console.error('Failed to create collection or fields:', error.message);
    process.exit(1);
  }
}

ensureMigrationCollection();
