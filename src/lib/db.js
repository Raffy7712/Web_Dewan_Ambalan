import { escapeLiteral, escapeIdentifier } from "pg";
import { createAdminClient } from "./supabase";

let _supabase = null;

function getSupabase() {
  if (_supabase) return _supabase;
  _supabase = createAdminClient();
  return _supabase;
}

function escapeVal(val) {
  if (val === null || val === undefined) return "NULL";
  const t = typeof val;
  if (t === "number") return String(val);
  if (t === "boolean") return val ? "TRUE" : "FALSE";
  if (val instanceof Date) return escapeLiteral(val.toISOString());
  if (Buffer.isBuffer(val)) return escapeLiteral(val.toString("hex"));
  if (t === "object") return escapeLiteral(JSON.stringify(val));
  return escapeLiteral(String(val));
}

function interpolateQuery(text, params) {
  if (!params || params.length === 0) return text;
  let idx = 0;
  return text.replace(/\$(\d+)/g, (match, num) => {
    const p = params[Number(num) - 1];
    return escapeVal(p);
  });
}

export async function query(text, params = []) {
  const start = Date.now();
  const supabase = getSupabase();
  const sql = interpolateQuery(text, params);
  const { data, error } = await supabase.rpc("exec_sql", { sql });
  if (error) throw new Error(error.message);
  if (data && data._type === "mutation") {
    return { rows: [], rowCount: data._row_count };
  }
  return { rows: data || [], rowCount: (data || []).length };
}

export async function getClient() {
  throw new Error("Transactions via pool are not available in Supabase REST mode");
}

export async function selectFrom(table, columns = "*", filters = {}) {
  const keys = Object.keys(filters);
  const where = keys.length > 0
    ? " WHERE " + keys.map((k, i) => `${k} = $${i + 1}`).join(" AND ")
    : "";
  const values = Object.values(filters);
  const sql = `SELECT ${columns} FROM ${table}${where}`;
  return query(sql, values);
}

export async function insertInto(table, data, returning = "*") {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
  const cols = keys.join(", ");
  const sql = `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) RETURNING ${returning}`;
  return query(sql, values);
}

export async function updateTable(table, data, filters, returning = "*") {
  const setKeys = Object.keys(data);
  const filterKeys = Object.keys(filters);
  const setClause = setKeys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const whereClause = filterKeys.map((k, i) => `${k} = $${setKeys.length + i + 1}`).join(" AND ");
  const values = [...Object.values(data), ...Object.values(filters)];
  const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING ${returning}`;
  return query(sql, values);
}

export async function deleteFrom(table, filters, returning = "*") {
  const keys = Object.keys(filters);
  const whereClause = keys.map((k, i) => `${k} = $${i + 1}`).join(" AND ");
  const values = Object.values(filters);
  const sql = `DELETE FROM ${table} WHERE ${whereClause} RETURNING ${returning}`;
  return query(sql, values);
}
