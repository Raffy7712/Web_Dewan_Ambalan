/**
 * db.js — Direct PostgreSQL connection (replaces Supabase client)
 * Uses node-postgres (pg) with connection pooling
 * Schema: app (set via search_path)
 *
 * IMPORTANT: Pool is lazily initialized to avoid crashing the build
 * when DATABASE_URL is not available at build time.
 */

import pg from "pg";

const { Pool } = pg;

let _pool = null;

function getPool() {
  if (_pool) return _pool;

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL wajib diset di environment variables");
  }

  _pool = new Pool({
    connectionString: DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    options: "-c search_path=app,public",
  });

  _pool.on("error", (err) => {
    console.error("[db] Unexpected pool error:", err.message);
  });

  return _pool;
}

/**
 * Run a query and return { rows, rowCount }
 */
export async function query(text, params = []) {
  const start = Date.now();
  const pool = getPool();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 2000) {
    console.warn(`[db] Slow query (${duration}ms):`, text.slice(0, 100));
  }
  return { rows: result.rows, rowCount: result.rowCount };
}

/**
 * Get a client from the pool (for transactions)
 */
export async function getClient() {
  const pool = getPool();
  const client = await pool.connect();
  await client.query("SET search_path TO app, public");
  return client;
}

/**
 * Helper: SELECT from a table with optional filters
 * Usage: selectFrom('accounts', '*', { id: '123' })
 */
export async function selectFrom(table, columns = "*", filters = {}) {
  const keys = Object.keys(filters);
  const where = keys.length > 0
    ? " WHERE " + keys.map((k, i) => `${k} = $${i + 1}`).join(" AND ")
    : "";
  const values = Object.values(filters);
  const sql = `SELECT ${columns} FROM ${table}${where}`;
  return query(sql, values);
}

/**
 * Helper: INSERT into a table
 * Usage: insertInto('accounts', { username: 'foo', role: 'user' })
 * Returns the inserted row(s)
 */
export async function insertInto(table, data, returning = "*") {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
  const cols = keys.join(", ");
  const sql = `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) RETURNING ${returning}`;
  return query(sql, values);
}

/**
 * Helper: UPDATE a table
 * Usage: updateTable('accounts', { role: 'admin' }, { id: '123' })
 */
export async function updateTable(table, data, filters, returning = "*") {
  const setKeys = Object.keys(data);
  const filterKeys = Object.keys(filters);
  const setClause = setKeys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const whereClause = filterKeys.map((k, i) => `${k} = $${setKeys.length + i + 1}`).join(" AND ");
  const values = [...Object.values(data), ...Object.values(filters)];
  const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING ${returning}`;
  return query(sql, values);
}

/**
 * Helper: DELETE from a table
 * Usage: deleteFrom('otp_tokens', { id: '123' })
 */
export async function deleteFrom(table, filters, returning = "*") {
  const keys = Object.keys(filters);
  const whereClause = keys.map((k, i) => `${k} = $${i + 1}`).join(" AND ");
  const values = Object.values(filters);
  const sql = `DELETE FROM ${table} WHERE ${whereClause} RETURNING ${returning}`;
  return query(sql, values);
}


