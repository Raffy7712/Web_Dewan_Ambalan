import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPaths = [
    path.join(__dirname, '../.env.local'),
    path.join(__dirname, '../.env'),
  ];
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
      console.log(`Loaded from ${path.basename(envPath)}`);
      return;
    }
  }
  console.error('No .env.local found');
  process.exit(1);
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function execSql(sql, label) {
  console.log(`\n--- ${label} ---`);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ sql }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${label} failed (${res.status}): ${text}`);
  console.log(`OK: ${text.slice(0, 200)}`);
}

async function main() {
  // Step 1: Lihat dulu jabatan yang ada
  const peek = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ sql: 'SELECT id, nama, urutan FROM jabatan ORDER BY urutan' }),
  });
  const before = await peek.json();
  console.log('\n=== Jabatan BEFORE ===');
  console.table(before);

  // Step 2: Buat jabatan baru (tanpa Putra/Putri)
  await execSql(`
    INSERT INTO jabatan (nama, urutan)
    SELECT base_nama, MIN(urutan) AS min_urutan
    FROM (
      SELECT 
        CASE 
          WHEN nama LIKE '% Putra' THEN LEFT(nama, LENGTH(nama) - 6)
          WHEN nama LIKE '% Putri' THEN LEFT(nama, LENGTH(nama) - 6)
        END AS base_nama,
        urutan
      FROM jabatan
      WHERE nama LIKE '% Putra' OR nama LIKE '% Putri'
    ) sub
    GROUP BY base_nama;
  `, 'Buat jabatan baru');

  // Step 3: Pindahin anggota ke jabatan baru
  await execSql(`
    UPDATE org_members m
    SET jabatan_id = (
      SELECT new_j.id FROM jabatan new_j
      JOIN jabatan old_j ON (
        old_j.nama = new_j.nama || ' Putra' OR old_j.nama = new_j.nama || ' Putri'
      )
      WHERE old_j.id = m.jabatan_id
      AND (old_j.nama LIKE '% Putra' OR old_j.nama LIKE '% Putri')
      AND new_j.id != old_j.id
    )
    WHERE m.jabatan_id IN (
      SELECT id FROM jabatan WHERE nama LIKE '% Putra' OR nama LIKE '% Putri'
    );
  `, 'Pindahin anggota');

  // Step 4: Hapus jabatan lama (Putra/Putri)
  await execSql(`
    DELETE FROM jabatan WHERE nama LIKE '% Putra' OR nama LIKE '% Putri';
  `, 'Hapus jabatan lama');

  // Step 5: Renumber urutan
  await execSql(`
    WITH numbered AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY urutan) AS new_urutan
      FROM jabatan
    )
    UPDATE jabatan j
    SET urutan = n.new_urutan
    FROM numbered n
    WHERE j.id = n.id;
  `, 'Renumber urutan');

  // Step 6: Lihat hasil
  const res2 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ sql: 'SELECT id, nama, urutan FROM jabatan ORDER BY urutan' }),
  });
  const after = await res2.json();
  console.log('\n=== Jabatan AFTER ===');
  console.table(after);

  console.log('\n✅ Migration selesai!');
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
