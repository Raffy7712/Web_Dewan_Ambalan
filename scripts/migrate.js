const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// 1. Load environment variables from .env.local or .env
function loadEnv() {
  const envPaths = [
    path.join(__dirname, '../.env.local'),
    path.join(__dirname, '../.env')
  ];
  
  let loaded = false;
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          process.env[key] = val;
        }
      });
      console.log(`\x1b[32m[migrate] Loaded environment variables from ${path.basename(envPath)}\x1b[0m`);
      loaded = true;
      break;
    }
  }
  
  if (!loaded) {
    console.warn('\x1b[33m[migrate] No .env.local or .env file found. Relying on system environment variables.\x1b[0m');
  }
}

loadEnv();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('\x1b[31m[migrate] ERROR: DATABASE_URL is not set in environment variables!\x1b[0m');
  process.exit(1);
}

// 2. Initialize PostgreSQL Pool
const pool = new Pool({
  connectionString: DATABASE_URL,
});

// All available migrations in chronological order
const ALL_MIGRATIONS = [
  'migration.sql',
  'migration-v2.sql',
  'migration-v3.sql',
  'migration-v4.sql',
  'migration-v5.sql',
  'migration-v6.sql',
  'migration-v7.sql',
  'migration-v8.sql',
  'migration-v9.sql',
  'migration-v10.sql',
  'migration-v11.sql',
  'migration-v12.sql',
  'migration-v14.sql', // Note: v13 is deprecated/cleaned up, recreated in v15
  'migration-v15.sql'
];

async function runMigrationFile(filename) {
  const filePath = path.join(__dirname, '../migrations', filename);
  if (!fs.existsSync(filePath)) {
    console.error(`\x1b[31m[migrate] File not found: ${filename}\x1b[0m`);
    return false;
  }

  console.log(`\x1b[36m[migrate] Running ${filename}...\x1b[0m`);
  const sql = fs.readFileSync(filePath, 'utf8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Set search path to app, public
    await client.query('SET search_path TO app, public');
    
    // Execute SQL content
    await client.query(sql);
    
    await client.query('COMMIT');
    console.log(`\x1b[32m[migrate] SUCCESS: ${filename} applied successfully.\x1b[0m`);
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`\x1b[31m[migrate] ERROR in ${filename}: ${err.message}\x1b[0m`);
    console.log(`\x1b[33m[migrate] WARNING: Some statements in ${filename} might have already been applied. Continuing...\x1b[0m`);
    return false;
  } finally {
    client.release();
  }
}

async function main() {
  const args = process.argv.slice(2);
  let filesToRun = [];

  if (args.length > 0) {
    // If specific migrations are passed as arguments (e.g. node migrate.js v14 v15)
    for (const arg of args) {
      const cleanArg = arg.toLowerCase();
      let matched = null;
      if (cleanArg === 'initial' || cleanArg === 'v1') {
        matched = 'migration.sql';
      } else {
        const num = cleanArg.replace(/[^0-9]/g, '');
        if (num) {
          matched = ALL_MIGRATIONS.find(f => f.includes(`-v${num}.sql`));
        }
      }
      
      if (matched) {
        filesToRun.push(matched);
      } else {
        console.error(`\x1b[31m[migrate] Unknown migration argument: ${arg}\x1b[0m`);
      }
    }
  } else {
    // Default to running v11, v12, v14, and v15 (the crucial recent updates)
    console.log('\x1b[34m[migrate] No arguments provided. Running latest core migrations (v11, v12, v14, v15)...\x1b[0m');
    filesToRun = ['migration-v11.sql', 'migration-v12.sql', 'migration-v14.sql', 'migration-v15.sql'];
  }

  if (filesToRun.length === 0) {
    console.log('\x1b[33m[migrate] No migrations to run.\x1b[0m');
    process.exit(0);
  }

  console.log(`\x1b[35m[migrate] Starting migrations: ${filesToRun.join(', ')}\x1b[0m`);
  
  for (const filename of filesToRun) {
    await runMigrationFile(filename);
  }

  console.log('\x1b[32m\x1b[1m[migrate] Migration process finished!\x1b[0m');
  await pool.end();
}

main().catch(err => {
  console.error('[migrate] Unexpected error:', err);
  process.exit(1);
});
