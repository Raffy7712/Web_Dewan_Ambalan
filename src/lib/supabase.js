/**
 * supabase.js — Compatibility layer
 * Provides a Supabase-like API backed by direct PostgreSQL
 * All existing code using createAdminClient().from().select().eq() still works
 *
 * Supported: .from(table).select(cols, opts).eq().neq().in().is().like()
 *            .ilike().gt().gte().lt().lte().not().or().contains()
 *            .order().limit().range().single().maybeSingle()
 *            .insert(data).upsert(data, opts).update(data).delete()
 *            .select() with { count: "exact" } returns { data, count, error }
 */

import { query } from "./db";

/**
 * Build a Supabase-like query builder
 */
function createQueryBuilder() {
  let _table = "";
  let _action = ""; // select, insert, update, delete, upsert
  let _columns = "*";
  let _filters = [];
  let _orFilters = []; // OR filter groups
  let _data = null;
  let _single = false;
  let _order = null;
  let _limit = null;
  let _offset = null;
  let _countMode = false; // { count: "exact" }
  let _upsertOpts = null;

  const builder = {
    from(table) {
      _table = table;
      return builder;
    },
    select(cols = "*", opts = {}) {
      if (!_action) _action = "select";
      _columns = cols || "*";
      if (opts.count === "exact") _countMode = true;
      return builder;
    },
    insert(data) {
      _action = "insert";
      _data = Array.isArray(data) ? data : [data];
      return builder;
    },
    upsert(data, opts = {}) {
      _action = "upsert";
      _data = Array.isArray(data) ? data : [data];
      _upsertOpts = opts;
      return builder;
    },
    update(data) {
      _action = "update";
      _data = data;
      return builder;
    },
    delete() {
      _action = "delete";
      return builder;
    },
    eq(col, val) {
      _filters.push({ col, op: "=", val });
      return builder;
    },
    neq(col, val) {
      _filters.push({ col, op: "!=", val });
      return builder;
    },
    in(col, vals) {
      _filters.push({ col, op: "IN", val: vals });
      return builder;
    },
    is(col, val) {
      _filters.push({ col, op: "IS", val });
      return builder;
    },
    not(col, op, val) {
      // Supabase .not("col", "is", null) → col IS NOT NULL
      if (op === "is" || op === "IS") {
        _filters.push({ col, op: "IS NOT", val });
      } else {
        _filters.push({ col, op: `NOT ${op.toUpperCase()}`, val });
      }
      return builder;
    },
    like(col, val) {
      _filters.push({ col, op: "LIKE", val });
      return builder;
    },
    ilike(col, val) {
      _filters.push({ col, op: "ILIKE", val });
      return builder;
    },
    gt(col, val) {
      _filters.push({ col, op: ">", val });
      return builder;
    },
    gte(col, val) {
      _filters.push({ col, op: ">=", val });
      return builder;
    },
    lt(col, val) {
      _filters.push({ col, op: "<", val });
      return builder;
    },
    lte(col, val) {
      _filters.push({ col, op: "<=", val });
      return builder;
    },
    contains(col, val) {
      _filters.push({ col, op: "@>", val });
      return builder;
    },
    /**
     * OR filter — parses Supabase-style OR string like:
     *   "code.ilike.%ABC%,title.ilike.%ABC%"
     * Each clause is: col.op.val
     */
    or(orString) {
      if (!orString) return builder;
      const clauses = orString.split(",").map((clause) => {
        // Parse "col.op.value" — op is between first and second dot
        // e.g. "code.ilike.%ABC%" → col=code, op=ilike, val=%ABC%
        const firstDot = clause.indexOf(".");
        const secondDot = clause.indexOf(".", firstDot + 1);
        if (firstDot === -1 || secondDot === -1) return null;
        const col = clause.slice(0, firstDot);
        const op = clause.slice(firstDot + 1, secondDot);
        const val = clause.slice(secondDot + 1);
        return { col, op: op.toUpperCase(), val };
      }).filter(Boolean);
      _orFilters.push(clauses);
      return builder;
    },
    order(col, opts = {}) {
      _order = { col, ascending: opts.ascending !== false };
      return builder;
    },
    limit(n) {
      _limit = n;
      return builder;
    },
    range(from, to) {
      _offset = from;
      _limit = to - from + 1;
      return builder;
    },
    single() {
      _single = true;
      return builder;
    },
    maybeSingle() {
      _single = true;
      return builder;
    },

    // Execute the query (thenable — supports `await query`)
    async then(resolve, reject) {
      try {
        const result = await execute();
        resolve(result);
      } catch (err) {
        resolve({ data: null, error: { message: err.message, code: err.code } });
      }
    },
  };

  /**
   * Helper: add a filter clause to WHERE parts and params
   */
  function addFilterClause(f, whereParts, params, paramIdx) {
    if (f.op === "IN") {
      const placeholders = f.val.map(() => `$${paramIdx.idx++}`).join(", ");
      whereParts.push(`${f.col} IN (${placeholders})`);
      params.push(...f.val);
    } else if (f.op === "IS") {
      whereParts.push(`${f.col} IS ${f.val === null ? "NULL" : f.val}`);
    } else if (f.op === "IS NOT") {
      whereParts.push(`${f.col} IS NOT ${f.val === null ? "NULL" : f.val}`);
    } else if (f.op === "@>") {
      whereParts.push(`${f.col} @> $${paramIdx.idx++}`);
      params.push(JSON.stringify(f.val));
    } else if (f.op === "LIKE" || f.op === "ILIKE") {
      whereParts.push(`${f.col} ${f.op} $${paramIdx.idx++}`);
      params.push(f.val);
    } else if (f.op === "NOT IN") {
      const placeholders = f.val.map(() => `$${paramIdx.idx++}`).join(", ");
      whereParts.push(`${f.col} NOT IN (${placeholders})`);
      params.push(...f.val);
    } else if (f.op === "NOT LIKE" || f.op === "NOT ILIKE") {
      whereParts.push(`${f.col} ${f.op} $${paramIdx.idx++}`);
      params.push(f.val);
    } else {
      whereParts.push(`${f.col} ${f.op} $${paramIdx.idx++}`);
      params.push(f.val);
    }
  }

  async function execute() {
    let paramIdx = { idx: 1 };
    const params = [];

    // Strip Supabase join syntax from SELECT columns (e.g., jabatan:jabatan(id,nama))
    // For now we just use the base columns without joins
    let selectCols = _columns;
    // Replace "col:table(cols)" with just the parent columns
    selectCols = selectCols.replace(/\w+:\w+\([^)]*\)/g, "").replace(/,\s*,/g, ",").replace(/^,\s*|,\s*$/g, "");
    if (!selectCols || selectCols.trim() === "") selectCols = "*";

    if (_action === "select") {
      let countSql = null;
      let countParams = [];
      if (_countMode) {
        // Build count query (same WHERE, no LIMIT/OFFSET)
        countSql = `SELECT COUNT(*) as count FROM ${_table}`;
        const countWhereParts = [];
        const countIdx = { idx: 1 };
        for (const f of _filters) {
          addFilterClause(f, countWhereParts, countParams, countIdx);
        }
        // OR filters for count
        if (_orFilters.length > 0) {
          const orParts = [];
          for (const group of _orFilters) {
            const groupParts = [];
            for (const clause of group) {
              const normalizedOp = clause.op === "ILIKE" ? "ILIKE" : clause.op;
              groupParts.push(`${clause.col} ${normalizedOp} $${countIdx.idx++}`);
              countParams.push(clause.val);
            }
            orParts.push("(" + groupParts.join(" OR ") + ")");
          }
          if (countWhereParts.length > 0) {
            countSql += " WHERE " + countWhereParts.join(" AND ") + " AND " + orParts.join(" AND ");
          } else {
            countSql += " WHERE " + orParts.join(" AND ");
          }
        } else if (countWhereParts.length > 0) {
          countSql += " WHERE " + countWhereParts.join(" AND ");
        }
      }

      // Build data query
      let sql = `SELECT ${selectCols} FROM ${_table}`;

      const whereParts = [];
      for (const f of _filters) {
        addFilterClause(f, whereParts, params, paramIdx);
      }

      // OR filters
      if (_orFilters.length > 0) {
        const orParts = [];
        for (const group of _orFilters) {
          const groupParts = [];
          for (const clause of group) {
            groupParts.push(`${clause.col} ${clause.op} $${paramIdx.idx++}`);
            params.push(clause.val);
          }
          orParts.push("(" + groupParts.join(" OR ") + ")");
        }
        if (whereParts.length > 0) {
          sql += " WHERE " + whereParts.join(" AND ") + " AND " + orParts.join(" AND ");
        } else {
          sql += " WHERE " + orParts.join(" AND ");
        }
      } else if (whereParts.length > 0) {
        sql += " WHERE " + whereParts.join(" AND ");
      }

      // ORDER
      if (_order) {
        sql += ` ORDER BY ${_order.col} ${_order.ascending ? "ASC" : "DESC"}`;
      }

      // LIMIT/OFFSET
      if (_limit) {
        sql += ` LIMIT $${paramIdx.idx++}`;
        params.push(_limit);
      }
      if (_offset) {
        sql += ` OFFSET $${paramIdx.idx++}`;
        params.push(_offset);
      }

      const { rows } = await query(sql, params);

      // Count query if requested
      let count = null;
      if (_countMode && countSql) {
        const { rows: countRows } = await query(countSql, countParams);
        count = Number(countRows[0]?.count) || 0;
      }

      if (_single) {
        if (rows.length === 0) {
          return _countMode ? { data: null, count, error: null } : { data: null, error: null };
        }
        return _countMode ? { data: rows[0], count, error: null } : { data: rows[0], error: null };
      }
      return _countMode ? { data: rows, count, error: null } : { data: rows, error: null };
    }

    if (_action === "insert") {
      // .insert(data).select() — return inserted rows
      const results = [];
      for (const row of _data) {
        const keys = Object.keys(row);
        const values = Object.values(row);
        const placeholders = keys.map(() => `$${paramIdx.idx++}`).join(", ");
        const cols = keys.join(", ");
        const sql = `INSERT INTO ${_table} (${cols}) VALUES (${placeholders}) RETURNING *`;
        const { rows: inserted } = await query(sql, values);
        results.push(...inserted);
      }
      if (_single && results.length > 0) {
        return { data: results[0], error: null };
      }
      return { data: results, error: null };
    }

    if (_action === "upsert") {
      const results = [];
      const onConflict = _upsertOpts?.onConflict;
      for (const row of _data) {
        const keys = Object.keys(row);
        const values = Object.values(row);
        const placeholders = keys.map(() => `$${paramIdx.idx++}`).join(", ");
        const cols = keys.join(", ");
        const conflictTarget = onConflict || (keys.includes("id") ? "id" : keys[0]);
        const updates = keys.filter(k => k !== conflictTarget.split(",")[0]).map(k => `${k} = EXCLUDED.${k}`).join(", ");
        const sql = updates
          ? `INSERT INTO ${_table} (${cols}) VALUES (${placeholders}) ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updates} RETURNING *`
          : `INSERT INTO ${_table} (${cols}) VALUES (${placeholders}) ON CONFLICT (${conflictTarget}) DO NOTHING RETURNING *`;
        const { rows: upserted } = await query(sql, values);
        results.push(...upserted);
      }
      if (_single && results.length > 0) {
        return { data: results[0], error: null };
      }
      return { data: results, error: null };
    }

    if (_action === "update") {
      const setKeys = Object.keys(_data);
      const setClause = setKeys.map((k) => `${k} = $${paramIdx.idx++}`).join(", ");
      const params2 = [...Object.values(_data)];

      const whereParts = [];
      for (const f of _filters) {
        const op = f.op === "IS" ? "IS" : f.op === "IS NOT" ? "IS NOT" : f.op;
        whereParts.push(`${f.col} ${op} $${paramIdx.idx++}`);
        if (op !== "IS" && op !== "IS NOT") params2.push(f.val);
      }
      const sql = `UPDATE ${_table} SET ${setClause}${whereParts.length > 0 ? " WHERE " + whereParts.join(" AND ") : ""} RETURNING *`;

      const { rows } = await query(sql, params2);
      if (_single && rows.length > 0) {
        return { data: rows[0], error: null };
      }
      return { data: rows, error: null };
    }

    if (_action === "delete") {
      const whereParts = [];
      for (const f of _filters) {
        const op = f.op === "IS" ? "IS" : f.op === "IS NOT" ? "IS NOT" : f.op;
        whereParts.push(`${f.col} ${op} $${paramIdx.idx++}`);
        if (op !== "IS" && op !== "IS NOT") params.push(f.val);
      }
      const sql = `DELETE FROM ${_table}${whereParts.length > 0 ? " WHERE " + whereParts.join(" AND ") : ""}`;

      await query(sql, params);
      return { data: null, error: null };
    }

    return { data: null, error: { message: "Unknown action" } };
  }

  return builder;
}

/**
 * Create an admin client (compatible with existing Supabase usage)
 * This replaces createAdminClient() from the old supabase.js
 */
export function createAdminClient() {
  return {
    from(table) {
      return createQueryBuilder().from(table);
    },
    // RPC support (for functions)
    async rpc(fn, params) {
      if (fn === "increment_page_view" || fn === "track_page_view") {
        const path = params?.path || "/";
        await query(
          "INSERT INTO page_view_logs (id, path, created_at) VALUES (gen_random_uuid(), $1, now())",
          [path]
        );
        return { data: { success: true }, error: null };
      }
      return { data: null, error: { message: `RPC function "${fn}" not implemented` } };
    },
  };
}
