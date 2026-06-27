/**
 * Link Mart — Data Access Layer (DAL)
 * Wraps all Supabase queries. Handles camelCase ↔ snake_case conversion
 * for every table automatically. Returns null when Supabase is not enabled.
 */
import { supabase, isSupabaseEnabled } from './supabase';

const USER_ID = 'default';

// ── Key converters ─────────────────────────────────────────────────────────
const toSnake = (str) => str.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
const toCamel = (str) => str.replace(/_([a-z])/g, (_, l) => l.toUpperCase());

/** Convert a camelCase JS object → snake_case Postgres row */
const toRow = (obj) => {
  const row = { user_id: USER_ID };
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) row[toSnake(k)] = v;
  }
  return row;
};

/** Convert a snake_case Postgres row → camelCase JS object */
const fromRow = (row) => {
  const obj = {};
  for (const [k, v] of Object.entries(row)) {
    obj[toCamel(k)] = v;
  }
  return obj;
};

// ── Generic table factory ──────────────────────────────────────────────────
/**
 * Creates standard CRUD helpers for a table.
 * @param {string} tableName   - Supabase table name (snake_case)
 * @param {string} orderCol    - Column to order results by (default: created_at)
 */
const makeTable = (tableName, orderCol = 'created_at') => ({
  /** Fetch all records for this user, ordered newest first */
  getAll: async () => {
    if (!isSupabaseEnabled) return null;
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('user_id', USER_ID)
      .order(orderCol, { ascending: false });
    if (error) throw error;
    return data.map(fromRow);
  },

  /** Insert or update a single record (by id) */
  upsert: async (record) => {
    if (!isSupabaseEnabled) return;
    const { error } = await supabase
      .from(tableName)
      .upsert(toRow(record), { onConflict: 'id' });
    if (error) throw error;
  },

  /** Upsert multiple records in one batch */
  upsertMany: async (records) => {
    if (!isSupabaseEnabled || !records.length) return;
    const { error } = await supabase
      .from(tableName)
      .upsert(records.map(toRow), { onConflict: 'id' });
    if (error) throw error;
  },

  /** Delete a single record by id */
  remove: async (id) => {
    if (!isSupabaseEnabled) return;
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) throw error;
  },

  /** Delete multiple records by id array */
  bulkRemove: async (ids) => {
    if (!isSupabaseEnabled || !ids.length) return;
    const { error } = await supabase.from(tableName).delete().in('id', ids);
    if (error) throw error;
  },

  /** Count all records for this user */
  count: async () => {
    if (!isSupabaseEnabled) return null;
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', USER_ID);
    if (error) throw error;
    return count;
  },
});

// ── Table definitions ──────────────────────────────────────────────────────
export const db = {
  publishers: makeTable('publishers', 'created_at'),
  leads:      makeTable('leads', 'created_at'),
  workLog:    makeTable('work_log', 'created_at'),
  emailHistory: makeTable('email_history', 'sent_at'),
  dataSheets: makeTable('data_sheets', 'uploaded_at'),
  activity:   makeTable('activity_log', 'timestamp'),

  // ── Planner Days (special: keyed object instead of array) ──
  plannerDays: {
    /** Returns an object keyed by date string: { '2024-01-15': {...} } */
    getAll: async () => {
      if (!isSupabaseEnabled) return null;
      const { data, error } = await supabase
        .from('planner_days')
        .select('*')
        .eq('user_id', USER_ID);
      if (error) throw error;
      const result = {};
      data.forEach((row) => {
        result[row.date] = fromRow(row);
      });
      return result;
    },

    upsert: async (dateStr, dayData) => {
      if (!isSupabaseEnabled) return;
      const row = toRow({ ...dayData, date: dateStr });
      if (!row.id) row.id = `plan-${dateStr}`;
      const { error } = await supabase
        .from('planner_days')
        .upsert(row, { onConflict: 'id' });
      if (error) throw error;
    },

    /** Bulk upsert from the plannerDays object { dateStr: dayData } */
    upsertMany: async (plannerObj) => {
      if (!isSupabaseEnabled) return;
      const rows = Object.entries(plannerObj).map(([dateStr, day]) => {
        const row = toRow({ ...day, date: dateStr });
        if (!row.id) row.id = `plan-${dateStr}`;
        return row;
      });
      if (!rows.length) return;
      const { error } = await supabase
        .from('planner_days')
        .upsert(rows, { onConflict: 'id' });
      if (error) throw error;
    },

    remove: async (dateStr) => {
      if (!isSupabaseEnabled) return;
      const { error } = await supabase
        .from('planner_days')
        .delete()
        .eq('date', dateStr)
        .eq('user_id', USER_ID);
      if (error) throw error;
    },

    count: async () => {
      if (!isSupabaseEnabled) return null;
      const { count, error } = await supabase
        .from('planner_days')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', USER_ID);
      if (error) throw error;
      return count;
    },
  },
};

// ── Connection health check ─────────────────────────────────────────────────
export const checkConnection = async () => {
  if (!isSupabaseEnabled) return { ok: false, reason: 'not_configured' };
  try {
    const { error } = await supabase.from('publishers').select('id').limit(1);
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
};

export { isSupabaseEnabled };
