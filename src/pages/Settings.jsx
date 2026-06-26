import React, { useState } from 'react';
import {
  Sun, Moon, Trash2, Download, Settings as SettingsIcon,
  Palette, Database, HardDrive, Mail, Sparkles, Plus, Edit,
  Check, Loader2, Play, CheckCircle, AlertCircle, Trash, Key, Eye, EyeOff, Save
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ConfirmModal from '../components/shared/ConfirmModal';

export default function Settings() {
  const {
    theme, toggleTheme, density, setDensity,
    publishers, leads, activity, stats,
    emailAccounts, addEmailAccount, updateEmailAccount, deleteEmailAccount, setDefaultAccount,
    aiSettings, saveAiSettings, toast
  } = useApp();

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'accounts' | 'ai'
  const [confirmClear, setConfirmClear] = useState(false);

  // ─── SMTP Account Form State ───
  const [showAccForm, setShowAccForm] = useState(false);
  const [editingAccId, setEditingAccId] = useState(null);
  const [accPreset, setAccPreset] = useState('custom');
  const [accForm, setAccForm] = useState({
    name: '',
    email: '',
    smtpHost: '',
    smtpPort: '587',
    smtpSecure: false,
    username: '',
    password: '',
    replyTo: '',
    signature: ''
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // ─── AI Settings Form State ───
  const [aiForm, setAiForm] = useState({ ...aiSettings });

  // ─── General Handlers ───
  const handleClearAll = () => {
    localStorage.removeItem('lm_publishers');
    localStorage.removeItem('lm_leads');
    localStorage.removeItem('lm_activity');
    localStorage.removeItem('lm_pub_cols');
    localStorage.removeItem('lm_lead_cols');
    localStorage.removeItem('lm_email_accounts');
    localStorage.removeItem('lm_ai_settings');
    localStorage.removeItem('lm_email_history');
    window.location.reload();
  };

  const handleExportBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      publishers,
      leads,
      activity,
      emailAccounts,
      aiSettings
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkmart-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── SMTP Account Handlers ───
  const handleOpenAddAccount = () => {
    setEditingAccId(null);
    setAccPreset('custom');
    setAccForm({
      name: '',
      email: '',
      smtpHost: '',
      smtpPort: '587',
      smtpSecure: false,
      username: '',
      password: '',
      replyTo: '',
      signature: ''
    });
    setTestResult(null);
    setShowAccForm(true);
  };

  const handleOpenEditAccount = (acc) => {
    setEditingAccId(acc.id);
    setAccPreset('custom');
    setAccForm({ ...acc });
    setTestResult(null);
    setShowAccForm(true);
  };

  const handlePresetChange = (preset) => {
    setAccPreset(preset);
    if (preset === 'gmail') {
      setAccForm(f => ({
        ...f,
        smtpHost: 'smtp.gmail.com',
        smtpPort: '587',
        smtpSecure: false
      }));
    } else if (preset === 'outlook') {
      setAccForm(f => ({
        ...f,
        smtpHost: 'smtp-mail.outlook.com',
        smtpPort: '587',
        smtpSecure: false
      }));
    }
  };

  const handleTestConnection = async () => {
    if (!accForm.smtpHost || !accForm.username || !accForm.password) {
      toast('error', 'Incomplete Form', 'SMTP Host, Username, and Password are required to test connection.');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const resp = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: accForm.smtpHost,
          port: Number(accForm.smtpPort),
          secure: Boolean(accForm.smtpSecure),
          username: accForm.username,
          password: accForm.password
        })
      });
      const data = await resp.json();
      if (resp.ok && data.ok) {
        setTestResult({ success: true, message: data.message });
        toast('success', 'SMTP Test Success', 'Connected to SMTP server successfully!');
      } else {
        setTestResult({ success: false, error: data.error || 'Connection failed' });
        toast('error', 'SMTP Test Failed', data.error || 'Check details and try again.');
      }
    } catch (err) {
      setTestResult({ success: false, error: err.message });
      toast('error', 'SMTP Connection Error', err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleSaveAccount = (e) => {
    e.preventDefault();
    if (!accForm.name || !accForm.email || !accForm.smtpHost || !accForm.username || !accForm.password) {
      toast('error', 'Required Fields', 'Please fill in Name, Email, SMTP Host, Username, and Password.');
      return;
    }

    if (editingAccId) {
      updateEmailAccount(editingAccId, accForm);
      toast('success', 'Account Updated', `SMTP account "${accForm.name}" updated.`);
    } else {
      addEmailAccount(accForm);
      toast('success', 'Account Added', `SMTP account "${accForm.name}" registered.`);
    }
    setShowAccForm(false);
  };

  // ─── AI Settings Handlers ───
  const handleSaveAiSettings = (e) => {
    e.preventDefault();
    saveAiSettings(aiForm);
    toast('success', 'AI Settings Saved', 'AI configuration updated successfully.');
  };

  // UI Components
  const Section = ({ icon: Icon, title, children }) => (
    <div className="card card-pad" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} style={{ color: 'var(--color-primary)' }} />
        </div>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{title}</h3>
      </div>
      {children}
    </div>
  );

  const Row = ({ label, desc, children }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ marginRight: 16, flex: 1 }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>{label}</div>
        {desc && <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{desc}</div>}
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Title */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SettingsIcon size={17} style={{ color: 'var(--color-primary)' }} />
            </span>
            Settings
          </h1>
          <p className="page-subtitle">Configure app preferences, email accounts, and AI tone parameters</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="country-tabs" style={{ marginBottom: 20 }}>
        <button
          className={`country-tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
          id="settings-tab-general"
        >
          General Settings
        </button>
        <button
          className={`country-tab ${activeTab === 'accounts' ? 'active' : ''}`}
          onClick={() => setActiveTab('accounts')}
          id="settings-tab-accounts"
        >
          <Mail size={13} style={{ marginRight: 4 }} /> Email Accounts ({emailAccounts.length})
        </button>
        <button
          className={`country-tab ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
          id="settings-tab-ai"
        >
          <Sparkles size={13} style={{ marginRight: 4 }} /> AI Prompt Settings
        </button>
      </div>

      {/* ─── TAB 1: GENERAL ─── */}
      {activeTab === 'general' && (
        <>
          <Section icon={Palette} title="Appearance">
            <Row label="Color Mode" desc="Switch between light and dark interface">
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { mode: 'light', icon: Sun, label: 'Light' },
                  { mode: 'dark', icon: Moon, label: 'Dark' },
                ].map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    id={`theme-${mode}-btn`}
                    onClick={() => {
                      if (theme !== mode) toggleTheme();
                    }}
                    className={`btn btn-sm ${theme === mode ? 'btn-primary' : 'btn-outline'}`}
                  >
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </div>
            </Row>

            <Row label="Table Density" desc="Control the spacing between table rows">
              <div className="density-toggle">
                {['compact', 'comfortable', 'spacious'].map(d => (
                  <button
                    key={d}
                    id={`density-${d}-btn`}
                    className={`density-btn ${density === d ? 'active' : ''}`}
                    onClick={() => setDensity(d)}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </Row>
          </Section>

          <Section icon={Database} title="Data Overview">
            {[
              { label: 'Total Publishers', value: publishers.length, color: 'var(--color-primary)' },
              { label: 'Total Client Leads', value: leads.length, color: '#7C3AED' },
              { label: 'Total Emails Sent', value: stats.totalEmailsSent || 0, color: '#10B981' },
              { label: 'Activity Log Entries', value: activity.length, color: 'var(--color-accent)' },
            ].map(({ label, value, color }) => (
              <Row key={label} label={label}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color }}>{value}</span>
              </Row>
            ))}
          </Section>

          <Section icon={HardDrive} title="Data Management">
            <Row label="Export Backup" desc="Download all records, credentials, and settings as a JSON backup">
              <button className="btn btn-outline btn-sm" onClick={handleExportBackup} id="export-backup-btn">
                <Download size={14} /> Export JSON Backup
              </button>
            </Row>
            <Row label="Clear All Data" desc="Permanently remove all tables, settings, accounts, and email logs">
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmClear(true)} id="clear-data-btn">
                <Trash2 size={14} /> Clear All Data
              </button>
            </Row>
          </Section>
        </>
      )}

      {/* ─── TAB 2: EMAIL ACCOUNTS ─── */}
      {activeTab === 'accounts' && (
        <div>
          {!showAccForm ? (
            <div className="card card-pad">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Outbound SMTP Accounts</h3>
                <button className="btn btn-primary btn-sm" onClick={handleOpenAddAccount} id="add-smtp-account-btn">
                  <Plus size={14} /> Add Account
                </button>
              </div>

              {emailAccounts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', border: '1px dashed var(--color-border)', borderRadius: 8 }}>
                  <Mail size={32} style={{ color: 'var(--color-text-muted)', marginBottom: 8 }} />
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>No SMTP accounts configured yet.</p>
                  <button className="btn btn-outline btn-sm" onClick={handleOpenAddAccount}>Configure SMTP Server</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {emailAccounts.map(acc => (
                    <div key={acc.id} style={{ padding: '12px 14px', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-bg-hover)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{acc.name}</span>
                            {acc.isDefault && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#D1FAE5', color: '#065F46', padding: '1px 6px', borderRadius: 999 }}>
                                Default
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>{acc.email}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                            SMTP: {acc.smtpHost}:{acc.smtpPort} ({acc.smtpSecure ? 'SSL' : 'TLS'})
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6 }}>
                          {!acc.isDefault && (
                            <button
                              className="btn btn-outline btn-xs"
                              style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                              onClick={() => setDefaultAccount(acc.id)}
                            >
                              Make Default
                            </button>
                          )}
                          <button
                            className="btn btn-outline btn-xs"
                            style={{ padding: 4 }}
                            onClick={() => handleOpenEditAccount(acc)}
                            title="Edit"
                            type="button"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            className="btn btn-outline btn-xs"
                            style={{ padding: 4, color: 'var(--color-danger-text)' }}
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete SMTP account "${acc.name}"?`)) {
                                deleteEmailAccount(acc.id);
                                toast('success', 'Account Deleted', 'SMTP account removed.');
                              }
                            }}
                            title="Delete"
                          >
                            <Trash size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card card-pad animate-scale-in">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 14 }}>
                {editingAccId ? 'Edit SMTP Account' : 'Add SMTP Account'}
              </h3>
              <form onSubmit={handleSaveAccount}>
                {/* Preset Selector */}
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Email Service Preset</label>
                  <select
                    className="form-select"
                    value={accPreset}
                    onChange={e => handlePresetChange(e.target.value)}
                    id="smtp-preset"
                  >
                    <option value="custom">Custom SMTP Server</option>
                    <option value="gmail">Google Gmail (App Password)</option>
                    <option value="outlook">Microsoft Outlook / Office 365</option>
                  </select>
                  {accPreset === 'gmail' && (
                    <div style={{ fontSize: '0.74rem', color: '#92400E', background: '#FEF3C7', padding: '6px 10px', borderRadius: 6, marginTop: 5 }}>
                      💡 <strong>Gmail:</strong> Requires 2-Step Verification enabled and an <strong>App Password</strong> generated in Google Account security. Regular passwords will be blocked by Google.
                    </div>
                  )}
                </div>

                <div className="form-grid form-grid-2" style={{ marginBottom: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Display Name *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Outreach Team"
                      value={accForm.name}
                      onChange={e => setAccForm(f => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sender Email Address *</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="outreach@agency.com"
                      value={accForm.email}
                      onChange={e => setAccForm(f => ({ ...f, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid form-grid-3" style={{ marginBottom: 12 }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">SMTP Server Host *</label>
                    <input
                      className="form-input"
                      placeholder="smtp.example.com"
                      value={accForm.smtpHost}
                      onChange={e => setAccForm(f => ({ ...f, smtpHost: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Port *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="587"
                      value={accForm.smtpPort}
                      onChange={e => setAccForm(f => ({ ...f, smtpPort: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.82rem' }}>
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={accForm.smtpSecure}
                      onChange={e => setAccForm(f => ({ ...f, smtpSecure: e.target.checked }))}
                    />
                    <span>Use SSL/TLS (usually checked for Port 465, unchecked for Port 587)</span>
                  </label>
                </div>

                <div className="form-grid form-grid-2" style={{ marginBottom: 12 }}>
                  <div className="form-group">
                    <label className="form-label">SMTP Username *</label>
                    <input
                      className="form-input"
                      placeholder="username or email"
                      value={accForm.username}
                      onChange={e => setAccForm(f => ({ ...f, username: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SMTP Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input"
                        placeholder="••••••••••••"
                        value={accForm.password}
                        onChange={e => setAccForm(f => ({ ...f, password: e.target.value }))}
                        required
                        style={{ paddingRight: 32 }}
                      />
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Reply-To Address (Optional)</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="replies@agency.com"
                    value={accForm.replyTo}
                    onChange={e => setAccForm(f => ({ ...f, replyTo: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Email Signature (Appended to sent emails)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Regards,&#10;John Doe&#10;CEO, SEO agency"
                    value={accForm.signature}
                    onChange={e => setAccForm(f => ({ ...f, signature: e.target.value }))}
                    rows={4}
                  />
                </div>

                {/* Connection Test Result */}
                {testResult && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: '0.8rem',
                    background: testResult.success ? '#E6F4EA' : '#FCE8E6',
                    border: `1px solid ${testResult.success ? '#A3D9A5' : '#F5C2C2'}`,
                    color: testResult.success ? '#137333' : '#C5221F',
                    display: 'flex', alignItems: 'center', gap: 8
                  }}>
                    {testResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <div>
                      {testResult.success ? testResult.message : `Connection failed: ${testResult.error}`}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleTestConnection}
                    disabled={testing}
                  >
                    {testing ? (
                      <>
                        <Loader2 size={13} style={{ animation: 'spin 1s linear infinite', marginRight: 4 }} />
                        Testing Connection...
                      </>
                    ) : (
                      <>
                        <Play size={13} style={{ marginRight: 4 }} />
                        Test Connection
                      </>
                    )}
                  </button>
                  <div style={{ flex: 1 }} />
                  <button type="button" className="btn btn-outline" onClick={() => setShowAccForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    <Save size={13} style={{ marginRight: 4 }} />
                    Save Account
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: AI PROMPT SETTINGS ─── */}
      {activeTab === 'ai' && (
        <div className="card card-pad">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 14 }}>
            AI Copywriting Configurations
          </h3>
          <form onSubmit={handleSaveAiSettings}>
            {/* Provider */}
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">AI Provider</label>
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="provider"
                    value="gemini"
                    checked={aiForm.provider === 'gemini'}
                    onChange={() => setAiForm(f => ({ ...f, provider: 'gemini' }))}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <strong>Google Gemini (Recommended)</strong>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="provider"
                    value="openai"
                    checked={aiForm.provider === 'openai'}
                    onChange={() => setAiForm(f => ({ ...f, provider: 'openai' }))}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <strong>OpenAI GPT</strong>
                </label>
              </div>
            </div>

            {/* API Key */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Key size={13} /> {aiForm.provider === 'gemini' ? 'Gemini' : 'OpenAI'} API Key
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter API key..."
                  value={aiForm.apiKey}
                  onChange={e => setAiForm(f => ({ ...f, apiKey: e.target.value }))}
                  style={{ paddingRight: 32 }}
                />
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: 4, display: 'block' }}>
                This key is saved locally in your browser's localStorage and is only transmitted to your local Express server (port 3001).
              </span>
            </div>

            <div className="form-grid form-grid-2" style={{ marginBottom: 12 }}>
              {/* Tone */}
              <div className="form-group">
                <label className="form-label">Email Writing Tone</label>
                <select
                  className="form-select"
                  value={aiForm.tone}
                  onChange={e => setAiForm(f => ({ ...f, tone: e.target.value }))}
                >
                  <option value="professional">Professional / Authoritative</option>
                  <option value="friendly">Friendly / Conversational</option>
                  <option value="casual">Casual / Direct</option>
                  <option value="formal">Formal / Elegant</option>
                </select>
              </div>

              {/* Word Count */}
              <div className="form-group">
                <label className="form-label">Max Length (Words): {aiForm.maxLength}</label>
                <input
                  type="range"
                  min="100"
                  max="500"
                  step="25"
                  value={aiForm.maxLength}
                  onChange={e => setAiForm(f => ({ ...f, maxLength: Number(e.target.value) }))}
                  className="filter-range-slider"
                />
              </div>
            </div>

            <div className="form-grid form-grid-2" style={{ marginBottom: 12 }}>
              {/* Company Name */}
              <div className="form-group">
                <label className="form-label">Your Company Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. RankBuilders"
                  value={aiForm.companyName}
                  onChange={e => setAiForm(f => ({ ...f, companyName: e.target.value }))}
                />
              </div>

              {/* Sender Name */}
              <div className="form-group">
                <label className="form-label">Default Sender Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. John Doe"
                  value={aiForm.senderName}
                  onChange={e => setAiForm(f => ({ ...f, senderName: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-grid form-grid-2" style={{ marginBottom: 12 }}>
              {/* Outreach Goal */}
              <div className="form-group">
                <label className="form-label">Outreach Goal / Purpose</label>
                <input
                  className="form-input"
                  placeholder="e.g. Backlink partnership, guest posting"
                  value={aiForm.goal}
                  onChange={e => setAiForm(f => ({ ...f, goal: e.target.value }))}
                />
              </div>

              {/* CTA */}
              <div className="form-group">
                <label className="form-label">Call To Action (CTA)</label>
                <input
                  className="form-input"
                  placeholder="e.g. Let me know if you are interested"
                  value={aiForm.cta}
                  onChange={e => setAiForm(f => ({ ...f, cta: e.target.value }))}
                />
              </div>
            </div>

            {/* Avoid Words */}
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Words/Phrases to Avoid (Comma separated)</label>
              <input
                className="form-input"
                placeholder="e.g. cheap, guaranteed rankings, link building services"
                value={aiForm.avoidWords}
                onChange={e => setAiForm(f => ({ ...f, avoidWords: e.target.value }))}
              />
            </div>

            {/* Competitors Toggle */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.82rem' }}>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={aiForm.mentionCompetitors}
                  onChange={e => setAiForm(f => ({ ...f, mentionCompetitors: e.target.checked }))}
                />
                <span>Include competitor organic search ranking tips in client pitches (CRM Leads)</span>
              </label>
            </div>

            {/* Prompt Preview */}
            <div style={{
              background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)',
              borderRadius: 8, padding: '14px', marginBottom: 18
            }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: '0.05em' }}>
                System Prompt Preview
              </div>
              <div style={{
                fontSize: '0.78rem', color: 'var(--color-text-secondary)',
                lineHeight: 1.5, fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: 150, overflowY: 'auto'
              }}>
                {`You are an expert SEO outreach specialist and sales copywriter.
Tone: ${aiForm.tone || 'professional'}
Max Length: ${aiForm.maxLength || 250} words
Call-to-action: ${aiForm.cta || 'Reply to this email'}
${aiForm.avoidWords ? `Avoid words: ${aiForm.avoidWords}\n` : ''}${aiForm.companyName ? `Company: ${aiForm.companyName}\n` : ''}${aiForm.senderName ? `Sender: ${aiForm.senderName}\n` : ''}Write concise, personalized, human-sounding emails.`}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" id="save-ai-settings-btn" style={{ width: '100%' }}>
              <Save size={14} style={{ marginRight: 6 }} /> Save AI Configurations
            </button>
          </form>
        </div>
      )}

      {/* About */}
      <div className="card card-pad" style={{ borderTop: '3px solid var(--color-accent)', marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #0F2A44, #C9A24D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
            LM
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Link Mart v3.0</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>AI Outreach Suite · Publisher Backlink Database · Client Hunting CRM</div>
          </div>
        </div>
      </div>

      {confirmClear && (
        <ConfirmModal
          title="Clear All Data?"
          message="This will permanently delete ALL publishers, leads, SMTP credentials, AI configurations, and email history logs. This cannot be undone."
          confirmLabel="Yes, Clear Everything"
          variant="danger"
          onConfirm={handleClearAll}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </div>
  );
}
