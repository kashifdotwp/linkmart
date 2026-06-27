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

// ── Allowed columns per table (prevents "column not found" errors) ─────────
const PUBLISHER_COLS = new Set([
  'id','user_id','domain','url','country','language','niche','link_type','link_attribute',
  'dr','da','organic_traffic','referring_domains','backlinks','spam_score',
  'seller_price','client_price','profit','primary_contact','email','whatsapp',
  'status','tags','starred','notes','last_updated','created_at','top5_topics',
]);
const LEAD_COLS = new Set([
  'id','user_id','website','country','niche','dr','organic_traffic','avg_serp_position',
  'email','phone','status','follow_up_date','tags','starred','notes','created_at',
  'last_contacted',
]);
const WORKLOG_COLS = new Set([
  'id','user_id','client_website','linked_lead_id','publisher_id','link_delivered',
  'anchor_text','link_attribute','invoice_amount','status','date','notes',
  'created_at','last_updated',
]);
const PLANNER_COLS = new Set([
  'id','user_id','date','goals','actual','tasks','notes',
]);
const EMAIL_HIST_COLS = new Set([
  'id','user_id','record_id','record_type','to_email','subject','body','status','sent_at',
]);
const DATA_SHEET_COLS = new Set([
  'id','user_id','name','source','target_type','row_count','headers','rows',
  'mappings','status','uploaded_at',
]);
const ACTIVITY_COLS = new Set([
  'id','user_id','type','message','timestamp',
]);

/** Convert a camelCase JS object → snake_case Postgres row, filtered to allowed cols */
const toRow = (obj, allowedCols = null) => {
  const row = { user_id: USER_ID };
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      const snakeKey = toSnake(k);
      if (!allowedCols || allowedCols.has(snakeKey)) {
        row[snakeKey] = v;
      }
    }
  }
  return row;
};

/** Create a toRow function bound to a specific table's allowed columns */
const makeToRow = (allowedCols) => (obj) => toRow(obj, allowedCols);


/** Convert a snake_case Postgres row → camelCase JS object */
export const fromRow = (row) => {
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
 * @param {Set}    allowedCols - Whitelist of snake_case column names
 */
const makeTable = (tableName, orderCol = 'created_at', allowedCols = null) => {
  const rowMapper = allowedCols ? makeToRow(allowedCols) : (obj) => toRow(obj, null);
  return {
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
        .upsert(rowMapper(record), { onConflict: 'id' });
      if (error) throw error;
    },

    /** Upsert multiple records in one batch */
    upsertMany: async (records) => {
      if (!isSupabaseEnabled || !records.length) return;
      const { error } = await supabase
        .from(tableName)
        .upsert(records.map(rowMapper), { onConflict: 'id' });
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
  };
};

// ── Table definitions ──────────────────────────────────────────────────────
export const db = {
  publishers:   makeTable('publishers',   'created_at', PUBLISHER_COLS),
  leads:        makeTable('leads',        'created_at', LEAD_COLS),
  workLog:      makeTable('work_log',     'created_at', WORKLOG_COLS),
  emailHistory: makeTable('email_history','sent_at',    EMAIL_HIST_COLS),
  dataSheets:   makeTable('data_sheets',  'uploaded_at',DATA_SHEET_COLS),
  activity:     makeTable('activity_log', 'timestamp',  ACTIVITY_COLS),

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
      const row = toRow({ ...dayData, date: dateStr }, PLANNER_COLS);
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
        const row = toRow({ ...day, date: dateStr }, PLANNER_COLS);
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
