import { createDirectus, rest, staticToken, readCollection, readItems, createItem, readMe, login } from '@directus/sdk';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
const DIRECTUS_EMAIL = process.env.DIRECTUS_EMAIL;
const DIRECTUS_PASSWORD = process.env.DIRECTUS_PASSWORD;
const MIGRATIONS_COLLECTION = 'schema_migrations';

if (!process.env.DIRECTUS_URL) {
  console.warn(`DIRECTUS_URL not set; defaulting to ${DIRECTUS_URL}`);
}

function buildClientWithToken(token) {
  return createDirectus(DIRECTUS_URL).with(staticToken(token)).with(rest());
}

async function buildAuthedClient() {
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

  // Fallback to email/password login.
  if (DIRECTUS_EMAIL && DIRECTUS_PASSWORD) {
    const baseClient = createDirectus(DIRECTUS_URL).with(rest());
    const authData = await baseClient.request(
      login({ email: DIRECTUS_EMAIL, password: DIRECTUS_PASSWORD }, { mode: 'json' }),
    );
    if (!authData?.access_token) throw new Error('Directus login did not return an access_token.');
    const authedClient = buildClientWithToken(authData.access_token);
    const me = await authedClient.request(readMe({ fields: ['id', 'email'] }));
    console.log(`Directus auth OK (login): me.email=${me?.email ?? '(unknown)'}`);
    return authedClient;
  }

  throw new Error(
    'Directus authentication failed. Provide either DIRECTUS_TOKEN OR DIRECTUS_EMAIL + DIRECTUS_PASSWORD in .migrations/.env',
  );
}

/**
 * Check if a collection exists
 */
const client = await buildAuthedClient();

async function collectionExists(collectionName) {
  try {
    await client.request(readCollection(collectionName));
    return true;
  } catch (error) {
    const code = error?.errors?.[0]?.extensions?.code;
    const status = error?.response?.status;
    const errorMessage = error?.message || '';

    // Check for "not found" cases
    const isNotFound = code === 'COLLECTION_NOT_FOUND' || status === 404;

    // Check for permission errors - these often occur when collection doesn't exist
    // or when token lacks permissions. For schema_migrations, we'll treat permission
    // errors as "not found" and suggest running setup:schema
    const isPermissionError = code === 'FORBIDDEN'
      || status === 403
      || errorMessage.toLowerCase().includes('permission')
      || errorMessage.toLowerCase().includes('don\'t have permission');

    if (isNotFound || (isPermissionError && collectionName === MIGRATIONS_COLLECTION)) {
      return false;
    }

    if (isPermissionError) {
      const message = `Permission error while checking collection "${collectionName}": ${errorMessage}. Please ensure your token has admin permissions.`;
      console.error(message);
      throw new Error(message);
    }

    const message = `Unexpected error while checking collection "${collectionName}": ${errorMessage}`;
    console.error(message);
    throw new Error(message);
  }
}

/**
 * Get applied migration filenames from the migrations collection
 */
async function getAppliedMigrations() {
  try {
    if (!(await collectionExists(MIGRATIONS_COLLECTION))) {
      throw new Error(
        `Collection "${MIGRATIONS_COLLECTION}" does not exist or you don't have permission to access it.\n` +
        `Please run "npm run setup:schema" first to create the migrations tracking collection.`
      );
    }

    const items = await client.request(
      readItems(MIGRATIONS_COLLECTION, {
        limit: -1,
        fields: ['filename']
      })
    );

    return items.map(item => item.filename);
  } catch (error) {
    console.error(`Error reading applied migrations: ${error.message}`);
    throw error;
  }
}

/**
 * Record a migration as applied
 */
async function recordMigration(migration) {
  try {
    await client.request(
      createItem(MIGRATIONS_COLLECTION, {
        filename: migration.filename,
        applied_at: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error(`Error recording migration ${migration.filename}: ${error.message}`);
    throw error;
  }
}

async function loadMigrations() {
  const migrationsDir = join(__dirname, 'migrations');

  try {
    const files = await readdir(migrationsDir);

    const migrationFiles = files
      .filter(file => /^\d+_.+\.js$/.test(file))
      .sort();

    const migrations = [];

    for (const file of migrationFiles) {
      const filePath = join(migrationsDir, file);
      const module = await import(filePath);

      const migrationId = file;
      const upFunction = module.up || module.default?.up;

      if (!upFunction) {
        console.warn(`Warning: ${file} is missing 'up' export, skipping`);
        continue;
      }

      migrations.push({
        file,
        id: migrationId,
        filename: file,
        up: upFunction
      });
    }

    return migrations;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('Error: migrations directory not found');
      return [];
    }
    throw error;
  }
}

async function migrate() {
  console.log('Starting migration process...\n');

  try {
    console.log('Checking applied migrations...');
    const appliedMigrations = await getAppliedMigrations();
    console.log(`   Found ${appliedMigrations.length} previously applied migration(s)\n`);

    console.log('Loading migration files...');
    const migrations = await loadMigrations();
    console.log(`   Found ${migrations.length} migration file(s)\n`);

    if (migrations.length === 0) {
      console.log('No migrations to run');
      return;
    }

    let appliedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const migration of migrations) {
      if (appliedMigrations.includes(migration.filename)) {
        console.log(`Skipping ${migration.filename} (${migration.id}) - already applied`);
        skippedCount++;
        continue;
      }

      try {
        console.log(`Applying ${migration.filename} (${migration.id})...`);

        await migration.up(client);
        await recordMigration(migration);

        console.log(`Applied ${migration.filename} (${migration.id})`);
        appliedCount++;
      } catch (error) {
        console.error(`Error applying ${migration.filename} (${migration.id}):`);
        console.error(`   ${error.message}`);
        if (error.stack) {
          console.error(`   Stack: ${error.stack}`);
        }
        errorCount++;
        break;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('Migration Summary:');
    console.log(`   Applied: ${appliedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log('='.repeat(50));

    if (errorCount > 0) {
      process.exit(1);
    } else {
      console.log('\nMigration process completed successfully!');
    }
  } catch (error) {
    console.error('\nFatal error during migration:');
    console.error(error);
    process.exit(1);
  }
}

migrate();
