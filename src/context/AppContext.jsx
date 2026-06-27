import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStorage, setStorage, generateId } from '../utils/helpers';
import { getConfig, updateConfig, DEFAULT_CONFIG } from '../utils/configStore';
import { SAMPLE_PUBLISHERS, SAMPLE_LEADS, SAMPLE_ACTIVITY } from '../utils/sampleData';
import { db, isSupabaseEnabled, fromRow } from '../lib/db';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const syncWarn = (label, err) => console.warn(`[Supabase sync] ${label}:`, err?.message || err);

export const AppProvider = ({ children }) => {
  // ── Sync Status ──
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | loading | syncing | error

  // ── Theme ──
  const [theme, setTheme] = useState(() => getStorage('lm_theme', 'light'));
  const [density, setDensity] = useState(() => getStorage('lm_density', 'comfortable'));
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); setStorage('lm_theme', theme); }, [theme]);
  useEffect(() => { document.documentElement.setAttribute('data-density', density); setStorage('lm_density', density); }, [density]);
  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  // ── Config ──
  const [config, setConfig] = useState(() => getConfig());
  const refreshConfig = () => setConfig(getConfig());
  const updateConfigKey = (key, values) => { updateConfig(key, values); refreshConfig(); };

  // ── Publishers ──
  const [publishers, setPublishers] = useState(() => {
    const stored = getStorage('lm_publishers', null);
    if (stored && stored.length > 0) return stored;
    const seeded = SAMPLE_PUBLISHERS;
    setStorage('lm_publishers', seeded);
    return seeded;
  });
  const savePublishers = (data) => { setPublishers(data); setStorage('lm_publishers', data); };

  const addPublisher = useCallback((pub) => {
    const dup = publishers.find(p => p.domain?.toLowerCase() === pub.domain?.toLowerCase());
    if (dup) return { status: 'duplicate', existing: dup };
    const newPub = {
      ...pub, id: generateId(), starred: false, tags: pub.tags || [],
      linkAttribute: pub.linkAttribute || 'Dofollow',
      profit: (Number(pub.clientPrice) || 0) - (Number(pub.sellerPrice) || 0),
      lastUpdated: new Date().toISOString(),
    };
    savePublishers([newPub, ...publishers]);
    logActivity('publisher_added', `Added website ${newPub.domain}`);
    db.publishers.upsert(newPub).catch(e => syncWarn('addPublisher', e));
    return { status: 'ok', pub: newPub };
  }, [publishers]);

  const updatePublisher = useCallback((id, data) => {
    const updated = publishers.map(p =>
      p.id === id
        ? { ...p, ...data, profit: (Number(data.clientPrice) || 0) - (Number(data.sellerPrice) || 0), lastUpdated: new Date().toISOString() }
        : p
    );
    savePublishers(updated);
    const changed = updated.find(p => p.id === id);
    if (changed) db.publishers.upsert(changed).catch(e => syncWarn('updatePublisher', e));
    logActivity('publisher_updated', `Updated website ${data.domain || id}`);
  }, [publishers]);

  const mergePublisher = useCallback((id, newData) => {
    let mergedRecord;
    const updated = publishers.map(p => {
      if (p.id !== id) return p;
      const merged = { ...p };
      Object.keys(newData).forEach(key => {
        if (newData[key] !== '' && newData[key] !== null && newData[key] !== undefined) merged[key] = newData[key];
      });
      merged.profit = (Number(merged.clientPrice) || 0) - (Number(merged.sellerPrice) || 0);
      merged.lastUpdated = new Date().toISOString();
      mergedRecord = merged;
      return merged;
    });
    savePublishers(updated);
    if (mergedRecord) db.publishers.upsert(mergedRecord).catch(e => syncWarn('mergePublisher', e));
    logActivity('publisher_updated', `Merged duplicate website ${newData.domain || id}`);
  }, [publishers]);

  const deletePublisher = useCallback((id) => {
    const pub = publishers.find(p => p.id === id);
    savePublishers(publishers.filter(p => p.id !== id));
    db.publishers.remove(id).catch(e => syncWarn('deletePublisher', e));
    if (pub) logActivity('publisher_deleted', `Deleted website ${pub.domain}`);
  }, [publishers]);

  const bulkDeletePublishers = useCallback((ids) => {
    savePublishers(publishers.filter(p => !ids.includes(p.id)));
    db.publishers.bulkRemove(ids).catch(e => syncWarn('bulkDeletePublishers', e));
    logActivity('publisher_deleted', `Bulk deleted ${ids.length} websites`);
  }, [publishers]);

  const bulkUpdatePublisherStatus = useCallback((ids, status) => {
    const updated = publishers.map(p => ids.includes(p.id) ? { ...p, status, lastUpdated: new Date().toISOString() } : p);
    savePublishers(updated);
    const changed = updated.filter(p => ids.includes(p.id));
    db.publishers.upsertMany(changed).catch(e => syncWarn('bulkUpdatePublisherStatus', e));
    logActivity('publisher_updated', `Updated status of ${ids.length} websites to ${status}`);
  }, [publishers]);

  const togglePublisherStar = useCallback((id) => {
    const updated = publishers.map(p => p.id === id ? { ...p, starred: !p.starred } : p);
    savePublishers(updated);
    const changed = updated.find(p => p.id === id);
    if (changed) db.publishers.upsert(changed).catch(e => syncWarn('togglePublisherStar', e));
  }, [publishers]);

  const importPublishers = useCallback((newPubs) => {
    const all = [...publishers];
    let added = 0, skipped = 0;
    const toSync = [];
    newPubs.forEach(pub => {
      const dup = all.find(p => p.domain?.toLowerCase() === pub.domain?.toLowerCase());
      if (dup) { skipped++; return; }
      const newPub = {
        ...pub, id: generateId(), starred: false, tags: pub.tags || [],
        linkAttribute: pub.linkAttribute || 'Dofollow',
        profit: (Number(pub.clientPrice) || 0) - (Number(pub.sellerPrice) || 0),
        lastUpdated: new Date().toISOString(),
      };
      all.unshift(newPub);
      toSync.push(newPub);
      added++;
    });
    savePublishers(all);
    if (toSync.length > 0) db.publishers.upsertMany(toSync).catch(e => syncWarn('importPublishers', e));
    logActivity('publisher_added', `Imported ${added} websites (${skipped} duplicates skipped)`);
    return { added, skipped };
  }, [publishers]);

  // ── Leads ──
  const [leads, setLeads] = useState(() => {
    const stored = getStorage('lm_leads', null);
    if (stored && stored.length > 0) return stored;
    const seeded = SAMPLE_LEADS;
    setStorage('lm_leads', seeded);
    return seeded;
  });
  const saveLeads = (data) => { setLeads(data); setStorage('lm_leads', data); };

  const addLead = useCallback((lead) => {
    const dup = leads.find(l => l.website?.toLowerCase() === lead.website?.toLowerCase());
    if (dup) return { status: 'duplicate', existing: dup };
    const newLead = { ...lead, id: generateId(), starred: false, tags: lead.tags || [] };
    saveLeads([newLead, ...leads]);
    logActivity('lead_added', `New lead: ${newLead.website}`);
    db.leads.upsert(newLead).catch(e => syncWarn('addLead', e));
    return { status: 'ok', lead: newLead };
  }, [leads]);

  const updateLead = useCallback((id, data) => {
    const updated = leads.map(l => l.id === id ? { ...l, ...data } : l);
    saveLeads(updated);
    const changed = updated.find(l => l.id === id);
    if (changed) db.leads.upsert(changed).catch(e => syncWarn('updateLead', e));
    logActivity('lead_contacted', `Updated lead ${data.website || id}`);
  }, [leads]);

  const mergeLead = useCallback((id, newData) => {
    let mergedRecord;
    const updated = leads.map(l => {
      if (l.id !== id) return l;
      const merged = { ...l };
      Object.keys(newData).forEach(key => { if (newData[key] !== '' && newData[key] != null) merged[key] = newData[key]; });
      mergedRecord = merged;
      return merged;
    });
    saveLeads(updated);
    if (mergedRecord) db.leads.upsert(mergedRecord).catch(e => syncWarn('mergeLead', e));
    logActivity('lead_contacted', `Merged duplicate lead ${newData.website || id}`);
  }, [leads]);

  const deleteLead = useCallback((id) => {
    const lead = leads.find(l => l.id === id);
    saveLeads(leads.filter(l => l.id !== id));
    db.leads.remove(id).catch(e => syncWarn('deleteLead', e));
    if (lead) logActivity('lead_deleted', `Deleted lead ${lead.website}`);
  }, [leads]);

  const bulkDeleteLeads = useCallback((ids) => {
    saveLeads(leads.filter(l => !ids.includes(l.id)));
    db.leads.bulkRemove(ids).catch(e => syncWarn('bulkDeleteLeads', e));
    logActivity('lead_deleted', `Bulk deleted ${ids.length} leads`);
  }, [leads]);

  const bulkUpdateLeadStatus = useCallback((ids, status) => {
    const updated = leads.map(l => ids.includes(l.id) ? { ...l, status } : l);
    saveLeads(updated);
    const changed = updated.filter(l => ids.includes(l.id));
    db.leads.upsertMany(changed).catch(e => syncWarn('bulkUpdateLeadStatus', e));
    logActivity('lead_contacted', `Updated status of ${ids.length} leads to ${status}`);
  }, [leads]);

  const toggleLeadStar = useCallback((id) => {
    const updated = leads.map(l => l.id === id ? { ...l, starred: !l.starred } : l);
    saveLeads(updated);
    const changed = updated.find(l => l.id === id);
    if (changed) db.leads.upsert(changed).catch(e => syncWarn('toggleLeadStar', e));
  }, [leads]);

  const importLeads = useCallback((newLeads) => {
    const all = [...leads];
    let added = 0, skipped = 0;
    const toSync = [];
    newLeads.forEach(lead => {
      if (all.find(l => l.website?.toLowerCase() === lead.website?.toLowerCase())) { skipped++; return; }
      const newLead = { ...lead, id: generateId(), starred: false, tags: lead.tags || [] };
      all.unshift(newLead);
      toSync.push(newLead);
      added++;
    });
    saveLeads(all);
    if (toSync.length > 0) db.leads.upsertMany(toSync).catch(e => syncWarn('importLeads', e));
    logActivity('lead_added', `Imported ${added} leads (${skipped} duplicates skipped)`);
    return { added, skipped };
  }, [leads]);

  // ── Work Log ──
  const [workLog, setWorkLog] = useState(() => getStorage('lm_worklog', []));
  const saveWorkLog = (data) => { setWorkLog(data); setStorage('lm_worklog', data); };

  const addWorkLog = useCallback((entry) => {
    const newEntry = { ...entry, id: generateId(), createdAt: new Date().toISOString(), lastUpdated: new Date().toISOString() };
    saveWorkLog([newEntry, ...workLog]);
    db.workLog.upsert(newEntry).catch(e => syncWarn('addWorkLog', e));
    logActivity('publisher_added', `Delivery added: ${newEntry.clientWebsite}`);
    return newEntry;
  }, [workLog]);

  const updateWorkLog = useCallback((id, data) => {
    const updated = workLog.map(w => w.id === id ? { ...w, ...data, lastUpdated: new Date().toISOString() } : w);
    saveWorkLog(updated);
    const changed = updated.find(w => w.id === id);
    if (changed) db.workLog.upsert(changed).catch(e => syncWarn('updateWorkLog', e));
  }, [workLog]);

  const deleteWorkLog = useCallback((id) => {
    saveWorkLog(workLog.filter(w => w.id !== id));
    db.workLog.remove(id).catch(e => syncWarn('deleteWorkLog', e));
  }, [workLog]);

  const bulkDeleteWorkLog = useCallback((ids) => {
    saveWorkLog(workLog.filter(w => !ids.includes(w.id)));
    db.workLog.bulkRemove(ids).catch(e => syncWarn('bulkDeleteWorkLog', e));
  }, [workLog]);

  // ── Daily Planner ──
  const [plannerDays, setPlannerDays] = useState(() => getStorage('lm_planner', {}));

  const getPlannerDay = useCallback((dateStr) => {
    return plannerDays[dateStr] || {
      date: dateStr, goals: { outreach: 10, responses: 5 },
      actual: { outreach: 0, responses: 0 }, tasks: [], notes: '',
    };
  }, [plannerDays]);

  const savePlannerDay = useCallback((dateStr, dayData) => {
    const updated = { ...plannerDays, [dateStr]: dayData };
    setPlannerDays(updated);
    setStorage('lm_planner', updated);
    db.plannerDays.upsert(dateStr, dayData).catch(e => syncWarn('savePlannerDay', e));
  }, [plannerDays]);

  const deletePlannerDay = useCallback((dateStr) => {
    const updated = { ...plannerDays };
    delete updated[dateStr];
    setPlannerDays(updated);
    setStorage('lm_planner', updated);
    db.plannerDays.remove(dateStr).catch(e => syncWarn('deletePlannerDay', e));
  }, [plannerDays]);

  // ── Email Accounts ──
  const [emailAccounts, setEmailAccounts] = useState(() => getStorage('lm_email_accounts', []));
  const saveEmailAccounts = useCallback((accounts) => {
    setEmailAccounts(accounts);
    setStorage('lm_email_accounts', accounts);
  }, []);

  const addEmailAccount = useCallback((account) => {
    const newAcc = { ...account, id: generateId() };
    const updated = [...emailAccounts, newAcc];
    if (updated.length === 1) updated[0].isDefault = true;
    saveEmailAccounts(updated);
    return newAcc;
  }, [emailAccounts]);

  const updateEmailAccount = useCallback((id, data) => {
    saveEmailAccounts(emailAccounts.map(a => a.id === id ? { ...a, ...data } : a));
  }, [emailAccounts]);

  const deleteEmailAccount = useCallback((id) => {
    saveEmailAccounts(emailAccounts.filter(a => a.id !== id));
  }, [emailAccounts]);

  const setDefaultAccount = useCallback((id) => {
    saveEmailAccounts(emailAccounts.map(a => ({ ...a, isDefault: a.id === id })));
  }, [emailAccounts]);

  // ── AI Settings ──
  const [aiSettings, setAiSettings] = useState(() => getStorage('lm_ai_settings', {
    provider: 'gemini', apiKey: '', tone: 'professional', maxLength: 250,
    goal: 'Reply to this email', cta: 'Reply to this email', avoidWords: '',
    mentionCompetitors: false, companyName: '', senderName: '', signature: '',
  }));
  const saveAiSettings = useCallback((settings) => {
    setAiSettings(settings);
    setStorage('lm_ai_settings', settings);
  }, []);

  // ── Email History ──
  const [emailHistory, setEmailHistory] = useState(() => getStorage('lm_email_history', []));
  const saveEmailHistory = (data) => { setEmailHistory(data); setStorage('lm_email_history', data); };

  const addEmailHistory = useCallback((entry) => {
    const newEntry = { ...entry, id: generateId(), sentAt: new Date().toISOString() };
    const updated = [newEntry, ...emailHistory].slice(0, 500);
    saveEmailHistory(updated);
    db.emailHistory.upsert(newEntry).catch(e => syncWarn('addEmailHistory', e));
    return newEntry;
  }, [emailHistory]);

  const getEmailHistoryForRecord = useCallback((recordId) => {
    return emailHistory.filter(e => e.recordId === recordId);
  }, [emailHistory]);

  // ── Data Sheets ──
  const [dataSheets, setDataSheets] = useState(() => getStorage('lm_data_sheets', []));
  const saveDataSheets = (data) => { setDataSheets(data); setStorage('lm_data_sheets', data); };

  const addDataSheet = useCallback((sheet) => {
    const newSheet = { ...sheet, id: generateId(), uploadedAt: new Date().toISOString(), status: 'Imported' };
    saveDataSheets([newSheet, ...dataSheets]);
    db.dataSheets.upsert(newSheet).catch(e => syncWarn('addDataSheet', e));
    logActivity('sheet_added', `Uploaded raw sheet: ${newSheet.name}`);
    return newSheet;
  }, [dataSheets]);

  const deleteDataSheet = useCallback((id) => {
    const sheet = dataSheets.find(s => s.id === id);
    saveDataSheets(dataSheets.filter(s => s.id !== id));
    db.dataSheets.remove(id).catch(e => syncWarn('deleteDataSheet', e));
    if (sheet) logActivity('sheet_deleted', `Removed sheet: ${sheet.name}`);
  }, [dataSheets]);

  const mergeDataSheetToDatabase = useCallback((sheetId, targetType) => {
    const sheet = dataSheets.find(s => s.id === sheetId);
    if (!sheet) return { status: 'error', message: 'Sheet not found' };

    const { rows, mappings } = sheet;
    const mappedRecords = rows.map(row => {
      const record = {};
      Object.keys(mappings).forEach(targetKey => {
        const csvHeader = mappings[targetKey];
        if (csvHeader) record[targetKey] = row[csvHeader] ?? '';
      });
      return record;
    });

    let result;
    if (targetType === 'publisher') {
      const cleanedRecords = mappedRecords.map(rec => ({
        ...rec, dr: rec.dr ? Number(rec.dr) || '' : '', da: rec.da ? Number(rec.da) || '' : '',
        organicTraffic: rec.organicTraffic ? Number(rec.organicTraffic) || '' : '',
        referringDomains: rec.referringDomains ? Number(rec.referringDomains) || '' : '',
        backlinks: rec.backlinks ? Number(rec.backlinks) || '' : '',
        spamScore: rec.spamScore ? Number(rec.spamScore) || '' : '',
        sellerPrice: rec.sellerPrice ? Number(rec.sellerPrice) || '' : '',
        clientPrice: rec.clientPrice ? Number(rec.clientPrice) || '' : '',
        status: rec.status || 'Active',
      }));
      result = importPublishers(cleanedRecords);
    } else {
      const cleanedRecords = mappedRecords.map(rec => ({
        ...rec, dr: rec.dr ? Number(rec.dr) || '' : '',
        organicTraffic: rec.organicTraffic ? Number(rec.organicTraffic) || '' : '',
        avgSerpPosition: rec.avgSerpPosition ? Number(rec.avgSerpPosition) || '' : '',
        status: rec.status || 'New',
      }));
      result = importLeads(cleanedRecords);
    }

    const updatedStatus = targetType === 'publisher' ? 'Merged to Publishers' : 'Merged to CRM Leads';
    const updatedSheets = dataSheets.map(s => s.id === sheetId ? { ...s, status: updatedStatus } : s);
    saveDataSheets(updatedSheets);
    const updatedSheet = updatedSheets.find(s => s.id === sheetId);
    if (updatedSheet) db.dataSheets.upsert(updatedSheet).catch(e => syncWarn('mergeDataSheet', e));

    logActivity('sheet_merged', `Merged ${result.added} rows from sheet "${sheet.name}" into ${targetType === 'publisher' ? 'Publishers' : 'CRM Leads'}`);
    return { status: 'ok', ...result };
  }, [dataSheets, importPublishers, importLeads]);

  // ── Activity Log ──
  const [activity, setActivity] = useState(() => {
    const stored = getStorage('lm_activity', null);
    if (stored && stored.length > 0) return stored;
    setStorage('lm_activity', SAMPLE_ACTIVITY);
    return SAMPLE_ACTIVITY;
  });

  const logActivity = (type, message) => {
    const entry = { id: generateId(), type, message, timestamp: new Date().toISOString() };
    db.activity.upsert(entry).catch(e => syncWarn('logActivity', e));
    setActivity(prev => {
      const updated = [entry, ...prev].slice(0, 100);
      setStorage('lm_activity', updated);
      return updated;
    });
  };

  // ── Toasts ──
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((type, title, msg) => {
    const id = generateId();
    setToasts(prev => [...prev, { id, type, title, msg }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const dismissToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // ── Global Search ──
  const [globalSearch, setGlobalSearch] = useState('');

  // ── Supabase: Load from cloud on mount ─────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseEnabled) return;
    const loadFromCloud = async () => {
      try {
        setSyncStatus('loading');
        const [pubs, leds, wl, planDays, emailHist, sheets, act] = await Promise.all([
          db.publishers.getAll(),
          db.leads.getAll(),
          db.workLog.getAll(),
          db.plannerDays.getAll(),
          db.emailHistory.getAll(),
          db.dataSheets.getAll(),
          db.activity.getAll(),
        ]);
        // Only overwrite local cache if Supabase has data
        if (pubs && pubs.length > 0) { setPublishers(pubs); setStorage('lm_publishers', pubs); }
        if (leds && leds.length > 0) { setLeads(leds); setStorage('lm_leads', leds); }
        if (wl && wl.length > 0) { setWorkLog(wl); setStorage('lm_worklog', wl); }
        if (planDays && Object.keys(planDays).length > 0) { setPlannerDays(planDays); setStorage('lm_planner', planDays); }
        if (emailHist && emailHist.length > 0) { setEmailHistory(emailHist); setStorage('lm_email_history', emailHist); }
        if (sheets && sheets.length > 0) { setDataSheets(sheets); setStorage('lm_data_sheets', sheets); }
        if (act && act.length > 0) { setActivity(act); setStorage('lm_activity', act); }
        setSyncStatus('idle');
      } catch (err) {
        console.warn('[LinkMart] Supabase load failed, using localStorage cache:', err.message);
        setSyncStatus('error');
      }
    };
    loadFromCloud();
  }, []);

  // ── Supabase Realtime Subscriptions for Auto-Sync ──────────────────────────
  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) return;

    const channel = supabase
      .channel('realtime-sync')
      // Listen to Publishers
      .on('postgres_changes', { event: '*', schema: 'public', table: 'publishers' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newRow = fromRow(payload.new);
          setPublishers(prev => prev.some(p => p.id === newRow.id) ? prev : [newRow, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          const newRow = fromRow(payload.new);
          setPublishers(prev => prev.map(p => p.id === newRow.id ? newRow : p));
        } else if (payload.eventType === 'DELETE') {
          setPublishers(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      // Listen to CRM Leads
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newRow = fromRow(payload.new);
          setLeads(prev => prev.some(l => l.id === newRow.id) ? prev : [newRow, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          const newRow = fromRow(payload.new);
          setLeads(prev => prev.map(l => l.id === newRow.id ? newRow : l));
        } else if (payload.eventType === 'DELETE') {
          setLeads(prev => prev.filter(l => l.id !== payload.old.id));
        }
      })
      // Listen to Work Log
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_log' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newRow = fromRow(payload.new);
          setWorkLog(prev => prev.some(w => w.id === newRow.id) ? prev : [newRow, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          const newRow = fromRow(payload.new);
          setWorkLog(prev => prev.map(w => w.id === newRow.id ? newRow : w));
        } else if (payload.eventType === 'DELETE') {
          setWorkLog(prev => prev.filter(w => w.id !== payload.old.id));
        }
      })
      // Listen to Planner Days
      .on('postgres_changes', { event: '*', schema: 'public', table: 'planner_days' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newDay = fromRow(payload.new);
          setPlannerDays(prev => ({ ...prev, [newDay.date]: newDay }));
        } else if (payload.eventType === 'DELETE') {
          setPlannerDays(prev => {
            const copy = { ...prev };
            delete copy[payload.old.date];
            return copy;
          });
        }
      })
      // Listen to Email History
      .on('postgres_changes', { event: '*', schema: 'public', table: 'email_history' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newRow = fromRow(payload.new);
          setEmailHistory(prev => prev.some(e => e.id === newRow.id) ? prev : [newRow, ...prev]);
        }
      })
      // Listen to Data Sheets
      .on('postgres_changes', { event: '*', schema: 'public', table: 'data_sheets' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newRow = fromRow(payload.new);
          setDataSheets(prev => prev.some(s => s.id === newRow.id) ? prev : [newRow, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          const newRow = fromRow(payload.new);
          setDataSheets(prev => prev.map(s => s.id === newRow.id ? newRow : s));
        } else if (payload.eventType === 'DELETE') {
          setDataSheets(prev => prev.filter(s => s.id !== payload.old.id));
        }
      })
      // Listen to Activity Log
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_log' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newRow = fromRow(payload.new);
          setActivity(prev => prev.some(a => a.id === newRow.id) ? prev : [newRow, ...prev].slice(0, 100));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  // ── Migrate all localStorage data → Supabase ──────────────────────────────
  const migrateLocalToSupabase = useCallback(async () => {
    if (!isSupabaseEnabled) return { error: 'Supabase not configured' };
    try {
      setSyncStatus('syncing');
      await Promise.all([
        publishers.length > 0 && db.publishers.upsertMany(publishers),
        leads.length > 0 && db.leads.upsertMany(leads),
        workLog.length > 0 && db.workLog.upsertMany(workLog),
        Object.keys(plannerDays).length > 0 && db.plannerDays.upsertMany(plannerDays),
        emailHistory.length > 0 && db.emailHistory.upsertMany(emailHistory),
        dataSheets.length > 0 && db.dataSheets.upsertMany(dataSheets),
        activity.length > 0 && db.activity.upsertMany(activity),
      ]);
      setSyncStatus('idle');
      return { ok: true };
    } catch (err) {
      setSyncStatus('error');
      return { error: err.message };
    }
  }, [publishers, leads, workLog, plannerDays, emailHistory, dataSheets, activity]);

  // ── Re-sync from cloud ────────────────────────────────────────────────────
  const syncFromCloud = useCallback(async () => {
    if (!isSupabaseEnabled) return { error: 'Supabase not configured' };
    try {
      setSyncStatus('loading');
      const [pubs, leds, wl, planDays, emailHist, sheets, act] = await Promise.all([
        db.publishers.getAll(),
        db.leads.getAll(),
        db.workLog.getAll(),
        db.plannerDays.getAll(),
        db.emailHistory.getAll(),
        db.dataSheets.getAll(),
        db.activity.getAll(),
      ]);
      if (pubs) { setPublishers(pubs); setStorage('lm_publishers', pubs); }
      if (leds) { setLeads(leds); setStorage('lm_leads', leds); }
      if (wl) { setWorkLog(wl); setStorage('lm_worklog', wl); }
      if (planDays) { setPlannerDays(planDays); setStorage('lm_planner', planDays); }
      if (emailHist) { setEmailHistory(emailHist); setStorage('lm_email_history', emailHist); }
      if (sheets) { setDataSheets(sheets); setStorage('lm_data_sheets', sheets); }
      if (act) { setActivity(act); setStorage('lm_activity', act); }
      setSyncStatus('idle');
      return { ok: true };
    } catch (err) {
      setSyncStatus('error');
      return { error: err.message };
    }
  }, []);

  // ── Today planner badge ──
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPlan = plannerDays[todayStr];
  const incompleteTasks = todayPlan ? todayPlan.tasks.filter(t => !t.done).length : 0;

  // ── Stats ──
  const stats = {
    totalPublishers: publishers.length,
    totalLeads: leads.length,
    totalCountries: new Set([...publishers.map(p => p.country), ...leads.map(l => l.country)].filter(Boolean)).size,
    totalNiches: new Set([...publishers.map(p => p.niche), ...leads.map(l => l.niche)].filter(Boolean)).size,
    followUpsDue: leads.filter(l => {
      if (!l.followUpDate) return false;
      const d = new Date(l.followUpDate);
      const today = new Date();
      return d <= today && l.status !== 'Abandoned';
    }).length,
    interestedLeads: leads.filter(l => l.status === 'Interested').length,
    totalSellerCost: publishers.reduce((s, p) => s + (Number(p.sellerPrice) || 0), 0),
    estimatedRevenue: publishers.reduce((s, p) => s + (Number(p.clientPrice) || 0), 0),
    estimatedProfit: publishers.reduce((s, p) => s + (Number(p.profit) || 0), 0),
    starredPublishers: publishers.filter(p => p.starred).length,
    starredLeads: leads.filter(l => l.starred).length,
    workLogTotal: workLog.length,
    totalDelivered: workLog.filter(w => ['Delivered', 'Invoiced', 'Paid'].includes(w.status)).length,
    totalRevenuePaid: workLog.filter(w => w.status === 'Paid').reduce((s, w) => s + (Number(w.invoiceAmount) || 0), 0),
    incompleteTasks,
    totalEmailsSent: emailHistory.filter(e => e.status === 'sent').length,
    totalDataSheets: dataSheets.length,
  };

  return (
    <AppContext.Provider value={{
      // Theme
      theme, toggleTheme, density, setDensity,
      // Config
      config, refreshConfig, updateConfigKey,
      // Publishers
      publishers, addPublisher, updatePublisher, mergePublisher, deletePublisher,
      bulkDeletePublishers, bulkUpdatePublisherStatus, importPublishers, togglePublisherStar,
      // Leads
      leads, addLead, updateLead, mergeLead, deleteLead,
      bulkDeleteLeads, bulkUpdateLeadStatus, importLeads, toggleLeadStar,
      // Work Log
      workLog, addWorkLog, updateWorkLog, deleteWorkLog, bulkDeleteWorkLog,
      // Planner
      plannerDays, getPlannerDay, savePlannerDay, deletePlannerDay,
      // Email Accounts (localStorage only — contains passwords)
      emailAccounts, addEmailAccount, updateEmailAccount, deleteEmailAccount, setDefaultAccount,
      // AI Settings
      aiSettings, saveAiSettings,
      // Email History
      emailHistory, addEmailHistory, getEmailHistoryForRecord,
      // Data Sheets
      dataSheets, addDataSheet, deleteDataSheet, mergeDataSheetToDatabase,
      // Activity
      activity, logActivity,
      // Supabase Sync
      syncStatus, isSupabaseEnabled, migrateLocalToSupabase, syncFromCloud,
      // UI
      toasts, toast, dismissToast,
      globalSearch, setGlobalSearch,
      stats,
    }}>
      {children}
    </AppContext.Provider>
  );
};
