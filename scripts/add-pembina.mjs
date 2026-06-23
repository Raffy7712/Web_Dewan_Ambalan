import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const c = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
c.split('\n').forEach(l => {
  const t = l.trim();
  if (!t || t.startsWith('#')) return;
  const i = t.indexOf('=');
  if (i !== -1) {
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[t.slice(0, i).trim()] = v;
  }
});

const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
const k = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function sql(q, label) {
  console.log(`\n--- ${label} ---`);
  const r = await fetch(u + '/rest/v1/rpc/exec_sql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: k, 'Authorization': 'Bearer ' + k },
    body: JSON.stringify({ sql: q }),
  });
  const t = await r.text();
  console.log(r.ok ? 'OK' : 'FAIL', t.slice(0, 300));
}

(async () => {
  await sql(
    "INSERT INTO jabatan (nama, urutan) VALUES ('Pembina', 0);",
    'Tambah Pembina'
  );
  await sql(
    'WITH n AS (SELECT id, ROW_NUMBER() OVER (ORDER BY urutan) AS nu FROM jabatan) UPDATE jabatan j SET urutan = n.nu FROM n WHERE j.id = n.id;',
    'Renumber'
  );
  await sql(
    'SELECT id, nama, urutan FROM jabatan ORDER BY urutan',
    'Hasil akhir'
  );
})();
