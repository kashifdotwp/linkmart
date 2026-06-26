// ============================================================
//  CONFIG STORE — Dynamic dropdown/list management
//  All values readable/writable from the Config Panel page.
//  Components read from here instead of hardcoded arrays.
// ============================================================

import { getStorage, setStorage } from './helpers';

export const CONFIG_KEY = 'lm_config';

// ── Tag color palette ──
export const TAG_COLORS = [
  { id: 'teal',   bg: '#CCFBF1', text: '#0F766E', border: '#5EEAD4' },
  { id: 'blue',   bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' },
  { id: 'purple', bg: '#EDE9FE', text: '#7C3AED', border: '#C4B5FD' },
  { id: 'amber',  bg: '#FEF3C7', text: '#B45309', border: '#FCD34D' },
  { id: 'green',  bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' },
  { id: 'red',    bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' },
  { id: 'pink',   bg: '#FCE7F3', text: '#BE185D', border: '#F9A8D4' },
  { id: 'slate',  bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' },
];

// ── Default configuration ──
export const DEFAULT_CONFIG = {
  linkTypes: [
    'Guest Post',
    'Niche Edit',
    'Homepage Link',
    'Sponsored Post',
    'Resource Page',
    'Directory',
    'Link Exchange',
    'UGC',
  ],
  niches: [
    'Technology',
    'Finance',
    'Health',
    'Travel',
    'Real Estate',
    'Business',
    'E-commerce',
    'Legal',
    'Education',
    'Lifestyle',
    'Food & Lifestyle',
    'Fashion',
    'Marketing',
    'SEO',
    'Other',
  ],
  publisherStatuses: [
    'Active',
    'Verified',
    'Inactive',
    'Blacklisted',
    'Expensive',
    'No Response',
  ],
  leadStatuses: [
    'New',
    'Contacted',
    'Follow-up',
    'Interested',
    'Abandoned',
  ],
  workLogStatuses: [
    'Won',
    'Delivered',
    'Invoiced',
    'Paid',
  ],
  linkAttributes: [
    'Dofollow',
    'Nofollow',
    'Sponsored',
    'UGC',
  ],
  countries: [
    'USA',
    'UK',
    'Canada',
    'UAE',
    'Australia',
    'India',
    'Pakistan',
    'Germany',
    'France',
    'Netherlands',
    'Other',
  ],
  tags: [
    { id: 'tag-cheap',    label: 'Cheap',           color: 'green'  },
    { id: 'tag-premium',  label: 'Premium',          color: 'purple' },
    { id: 'tag-fasttat',  label: 'Fast TAT',         color: 'teal'   },
    { id: 'tag-neg',      label: 'Negotiable',       color: 'amber'  },
    { id: 'tag-trusted',  label: 'Trusted',          color: 'blue'   },
    { id: 'tag-monthly',  label: 'Monthly Partner',  color: 'pink'   },
    { id: 'tag-highdr',   label: 'High DR',          color: 'slate'  },
    { id: 'tag-bulk',     label: 'Bulk Discount',    color: 'red'    },
  ],
};

// ── Read full config (merged with defaults for missing keys) ──
export function getConfig() {
  const stored = getStorage(CONFIG_KEY, {});
  const merged = {};
  for (const key of Object.keys(DEFAULT_CONFIG)) {
    merged[key] = stored[key] !== undefined ? stored[key] : DEFAULT_CONFIG[key];
  }
  return merged;
}

// ── Update one config key ──
export function updateConfig(key, values) {
  const current = getStorage(CONFIG_KEY, {});
  const updated = { ...current, [key]: values };
  setStorage(CONFIG_KEY, updated);
  return updated;
}

// ── Tag helpers ──
export function getTagById(tags, id) {
  return tags.find(t => t.id === id) || null;
}

export function getTagColor(colorId) {
  return TAG_COLORS.find(c => c.id === colorId) || TAG_COLORS[7];
}

// ── React hook: live config (reads once; components should re-read on nav) ──
import { useState, useCallback } from 'react';

export function useConfig() {
  const [config, setConfigState] = useState(() => getConfig());

  const updateKey = useCallback((key, values) => {
    const next = updateConfig(key, values);
    setConfigState({ ...config, [key]: next[key] });
  }, [config]);

  const addTag = useCallback((label, color) => {
    const newTag = {
      id: `tag-${Date.now().toString(36)}`,
      label: label.trim(),
      color,
    };
    const tags = [...config.tags, newTag];
    updateConfig('tags', tags);
    setConfigState(c => ({ ...c, tags }));
    return newTag;
  }, [config]);

  const removeTag = useCallback((id) => {
    const tags = config.tags.filter(t => t.id !== id);
    updateConfig('tags', tags);
    setConfigState(c => ({ ...c, tags }));
  }, [config]);

  const updateTag = useCallback((id, changes) => {
    const tags = config.tags.map(t => t.id === id ? { ...t, ...changes } : t);
    updateConfig('tags', tags);
    setConfigState(c => ({ ...c, tags }));
  }, [config]);

  const refreshConfig = useCallback(() => {
    setConfigState(getConfig());
  }, []);

  return { config, updateKey, addTag, removeTag, updateTag, refreshConfig };
}
