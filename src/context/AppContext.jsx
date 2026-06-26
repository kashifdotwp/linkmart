import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStorage, setStorage, generateId } from '../utils/helpers';
import { getConfig, updateConfig, DEFAULT_CONFIG } from '../utils/configStore';
import { SAMPLE_PUBLISHERS, SAMPLE_LEADS, SAMPLE_ACTIVITY } from '../utils/sampleData';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
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
      ...pub,
      id: generateId(),
      starred: false,
      tags: pub.tags || [],
      linkAttribute: pub.linkAttribute || 'Dofollow',
      profit: (Number(pub.clientPrice) || 0) - (Number(pub.sellerPrice) || 0),
      lastUpdated: new Date().toISOString(),
    };
    const updated = [newPub, ...publishers];
    savePublishers(updated);
    logActivity('publisher_added', `Added website ${newPub.domain}`);
    return { status: 'ok', pub: newPub };
  }, [publishers]);

  const updatePublisher = useCallback((id, data) => {
    const updated = publishers.map(p =>
      p.id === id
        ? { ...p, ...data, profit: (Number(data.clientPrice) || 0) - (Number(data.sellerPrice) || 0), lastUpdated: new Date().toISOString() }
        : p
    );
    savePublishers(updated);
    logActivity('publisher_updated', `Updated website ${data.domain || id}`);
  }, [publishers]);

  const mergePublisher = useCallback((id, newData) => {
    const updated = publishers.map(p => {
      if (p.id !== id) return p;
      const merged = { ...p };
      Object.keys(newData).forEach(key => {
        if (newData[key] !== '' && newData[key] !== null && newData[key] !== undefined) merged[key] = newData[key];
      });
      merged.profit = (Number(merged.clientPrice) || 0) - (Number(merged.sellerPrice) || 0);
      merged.lastUpdated = new Date().toISOString();
      return merged;
    });
    savePublishers(updated);
    logActivity('publisher_updated', `Merged duplicate website ${newData.domain || id}`);
  }, [publishers]);

  const deletePublisher = useCallback((id) => {
    const pub = publishers.find(p => p.id === id);
    savePublishers(publishers.filter(p => p.id !== id));
    if (pub) logActivity('publisher_deleted', `Deleted website ${pub.domain}`);
  }, [publishers]);

  const bulkDeletePublishers = useCallback((ids) => {
    savePublishers(publishers.filter(p => !ids.includes(p.id)));
    logActivity('publisher_deleted', `Bulk deleted ${ids.length} websites`);
  }, [publishers]);

  const bulkUpdatePublisherStatus = useCallback((ids, status) => {
    savePublishers(publishers.map(p => ids.includes(p.id) ? { ...p, status, lastUpdated: new Date().toISOString() } : p));
    logActivity('publisher_updated', `Updated status of ${ids.length} websites to ${status}`);
  }, [publishers]);

  const togglePublisherStar = useCallback((id) => {
    savePublishers(publishers.map(p => p.id === id ? { ...p, starred: !p.starred } : p));
  }, [publishers]);

  const importPublishers = useCallback((newPubs) => {
    const all = [...publishers];
    let added = 0, skipped = 0;
    newPubs.forEach(pub => {
      const dup = all.find(p => p.domain?.toLowerCase() === pub.domain?.toLowerCase());
      if (dup) { skipped++; return; }
      all.unshift({ ...pub, id: generateId(), starred: false, tags: pub.tags || [], linkAttribute: pub.linkAttribute || 'Dofollow', profit: (Number(pub.clientPrice) || 0) - (Number(pub.sellerPrice) || 0), lastUpdated: new Date().toISOString() });
      added++;
    });
    savePublishers(all);
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
    return { status: 'ok', lead: newLead };
  }, [leads]);

  const updateLead = useCallback((id, data) => {
    saveLeads(leads.map(l => l.id === id ? { ...l, ...data } : l));
    logActivity('lead_contacted', `Updated lead ${data.website || id}`);
  }, [leads]);

  const mergeLead = useCallback((id, newData) => {
    const updated = leads.map(l => {
      if (l.id !== id) return l;
      const merged = { ...l };
      Object.keys(newData).forEach(key => { if (newData[key] !== '' && newData[key] != null) merged[key] = newData[key]; });
      return merged;
    });
    saveLeads(updated);
    logActivity('lead_contacted', `Merged duplicate lead ${newData.website || id}`);
  }, [leads]);

  const deleteLead = useCallback((id) => {
    const lead = leads.find(l => l.id === id);
    saveLeads(leads.filter(l => l.id !== id));
    if (lead) logActivity('lead_deleted', `Deleted lead ${lead.website}`);
  }, [leads]);

  const bulkDeleteLeads = useCallback((ids) => {
    saveLeads(leads.filter(l => !ids.includes(l.id)));
    logActivity('lead_deleted', `Bulk deleted ${ids.length} leads`);
  }, [leads]);

  const bulkUpdateLeadStatus = useCallback((ids, status) => {
    saveLeads(leads.map(l => ids.includes(l.id) ? { ...l, status } : l));
    logActivity('lead_contacted', `Updated status of ${ids.length} leads to ${status}`);
  }, [leads]);

  const toggleLeadStar = useCallback((id) => {
    saveLeads(leads.map(l => l.id === id ? { ...l, starred: !l.starred } : l));
  }, [leads]);

  const importLeads = useCallback((newLeads) => {
    const all = [...leads];
    let added = 0, skipped = 0;
    newLeads.forEach(lead => {
      if (all.find(l => l.website?.toLowerCase() === lead.website?.toLowerCase())) { skipped++; return; }
      all.unshift({ ...lead, id: generateId(), starred: false, tags: lead.tags || [] });
      added++;
    });
    saveLeads(all);
    logActivity('lead_added', `Imported ${added} leads (${skipped} duplicates skipped)`);
    return { added, skipped };
  }, [leads]);

  // ── Work Log ──
  const [workLog, setWorkLog] = useState(() => getStorage('lm_worklog', []));
  const saveWorkLog = (data) => { setWorkLog(data); setStorage('lm_worklog', data); };

  const addWorkLog = useCallback((entry) => {
    const newEntry = { ...entry, id: generateId(), createdAt: new Date().toISOString(), lastUpdated: new Date().toISOString() };
    saveWorkLog([newEntry, ...workLog]);
    logActivity('publisher_added', `Delivery added: ${newEntry.clientWebsite}`);
    return newEntry;
  }, [workLog]);

  const updateWorkLog = useCallback((id, data) => {
    saveWorkLog(workLog.map(w => w.id === id ? { ...w, ...data, lastUpdated: new Date().toISOString() } : w));
  }, [workLog]);

  const deleteWorkLog = useCallback((id) => { saveWorkLog(workLog.filter(w => w.id !== id)); }, [workLog]);
  const bulkDeleteWorkLog = useCallback((ids) => { saveWorkLog(workLog.filter(w => !ids.includes(w.id))); }, [workLog]);

  // ── Daily Planner ──
  const [plannerDays, setPlannerDays] = useState(() => getStorage('lm_planner', {}));

  const getPlannerDay = useCallback((dateStr) => {
    return plannerDays[dateStr] || {
      date: dateStr,
      goals: { outreach: 10, responses: 5 },
      actual: { outreach: 0, responses: 0 },
      tasks: [],
      notes: '',
    };
  }, [plannerDays]);

  const savePlannerDay = useCallback((dateStr, dayData) => {
    const updated = { ...plannerDays, [dateStr]: dayData };
    setPlannerDays(updated);
    setStorage('lm_planner', updated);
  }, [plannerDays]);

  const deletePlannerDay = useCallback((dateStr) => {
    const updated = { ...plannerDays };
    delete updated[dateStr];
    setPlannerDays(updated);
    setStorage('lm_planner', updated);
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
    // if first account, make it default
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
    provider: 'gemini',
    apiKey: '',
    tone: 'professional',
    maxLength: 250,
    goal: 'Reply to this email',
    cta: 'Reply to this email',
    avoidWords: '',
    mentionCompetitors: false,
    companyName: '',
    senderName: '',
    signature: '',
  }));

  const saveAiSettings = useCallback((settings) => {
    setAiSettings(settings);
    setStorage('lm_ai_settings', settings);
  }, []);

  // ── Email History ──
  const [emailHistory, setEmailHistory] = useState(() => getStorage('lm_email_history', []));
  const saveEmailHistory = (data) => { setEmailHistory(data); setStorage('lm_email_history', data); };

  const addEmailHistory = useCallback((entry) => {
    const newEntry = {
      ...entry,
      id: generateId(),
      sentAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...emailHistory].slice(0, 500);
    saveEmailHistory(updated);
    return newEntry;
  }, [emailHistory]);

  const getEmailHistoryForRecord = useCallback((recordId) => {
    return emailHistory.filter(e => e.recordId === recordId);
  }, [emailHistory]);

  // ── Data Sheets (Data Center) ──
  const [dataSheets, setDataSheets] = useState(() => getStorage('lm_data_sheets', []));
  const saveDataSheets = (data) => { setDataSheets(data); setStorage('lm_data_sheets', data); };

  const addDataSheet = useCallback((sheet) => {
    const newSheet = { ...sheet, id: generateId(), uploadedAt: new Date().toISOString(), status: 'Imported' };
    saveDataSheets([newSheet, ...dataSheets]);
    logActivity('sheet_added', `Uploaded raw sheet: ${newSheet.name}`);
    return newSheet;
  }, [dataSheets]);

  const deleteDataSheet = useCallback((id) => {
    const sheet = dataSheets.find(s => s.id === id);
    saveDataSheets(dataSheets.filter(s => s.id !== id));
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
        if (csvHeader) {
          record[targetKey] = row[csvHeader] ?? '';
        }
      });
      return record;
    });

    let result;
    if (targetType === 'publisher') {
      const cleanedRecords = mappedRecords.map(rec => ({
        ...rec,
        dr: rec.dr ? Number(rec.dr) || '' : '',
        da: rec.da ? Number(rec.da) || '' : '',
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
        ...rec,
        dr: rec.dr ? Number(rec.dr) || '' : '',
        organicTraffic: rec.organicTraffic ? Number(rec.organicTraffic) || '' : '',
        avgSerpPosition: rec.avgSerpPosition ? Number(rec.avgSerpPosition) || '' : '',
        status: rec.status || 'New',
      }));
      result = importLeads(cleanedRecords);
    }

    const updatedStatus = targetType === 'publisher' ? 'Merged to Publishers' : 'Merged to CRM Leads';
    saveDataSheets(dataSheets.map(s => s.id === sheetId ? { ...s, status: updatedStatus } : s));
    
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
      theme, toggleTheme, density, setDensity,
      config, refreshConfig, updateConfigKey,
      publishers, addPublisher, updatePublisher, mergePublisher, deletePublisher,
      bulkDeletePublishers, bulkUpdatePublisherStatus, importPublishers, togglePublisherStar,
      leads, addLead, updateLead, mergeLead, deleteLead,
      bulkDeleteLeads, bulkUpdateLeadStatus, importLeads, toggleLeadStar,
      workLog, addWorkLog, updateWorkLog, deleteWorkLog, bulkDeleteWorkLog,
      plannerDays, getPlannerDay, savePlannerDay, deletePlannerDay,
      emailAccounts, addEmailAccount, updateEmailAccount, deleteEmailAccount, setDefaultAccount,
      aiSettings, saveAiSettings,
      emailHistory, addEmailHistory, getEmailHistoryForRecord,
      dataSheets, addDataSheet, deleteDataSheet, mergeDataSheetToDatabase,
      activity, logActivity,
      toasts, toast, dismissToast,
      globalSearch, setGlobalSearch,
      stats,
    }}>
      {children}
    </AppContext.Provider>
  );
};
