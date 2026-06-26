import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Sparkles, Send, Copy, RefreshCw, Mail,
  ChevronDown, AlertCircle, CheckCircle, Loader2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const SERVER = '';

export default function AiEmailModal({ record, recordType, onClose }) {
  const { aiSettings, emailAccounts, addEmailHistory, toast } = useApp();

  const [phase, setPhase] = useState('generating'); // generating | editor | sending | sent | error
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(() =>
    emailAccounts.find(a => a.isDefault)?.id || emailAccounts[0]?.id || ''
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const recipientEmail = record?.email || '';
  const recipientName = record?.primaryContact || record?.website || record?.domain || '';
  const selectedAccount = emailAccounts.find(a => a.id === selectedAccountId);

  // ── Generate on mount ──
  const generate = useCallback(async () => {
    setPhase('generating');
    setErrorMsg('');
    try {
      const resp = await fetch(`${SERVER}/api/generate-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: aiSettings.provider || 'gemini',
          apiKey: aiSettings.apiKey,
          recordType,
          recordData: record,
          aiSettings,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || 'Generation failed');
      setSubject(data.subject);
      setBody(data.body);
      setPhase('editor');
    } catch (err) {
      setErrorMsg(err.message);
      setPhase('error');
    }
  }, [record, recordType, aiSettings]);

  useEffect(() => { generate(); }, []);

  // ── Copy email ──
  const handleCopy = () => {
    const text = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Send email ──
  const handleSend = async () => {
    if (!selectedAccount) { toast('error', 'No Email Account', 'Please add an email account in Settings → Email Accounts.'); return; }
    if (!recipientEmail) { toast('error', 'No Recipient', 'This record has no email address stored.'); return; }

    setPhase('sending');
    try {
      const resp = await fetch(`${SERVER}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: {
            host: selectedAccount.smtpHost,
            port: selectedAccount.smtpPort || 587,
            secure: selectedAccount.smtpSecure || false,
            username: selectedAccount.username,
            password: selectedAccount.password,
            email: selectedAccount.email,
            name: selectedAccount.name,
            signature: selectedAccount.signature,
            replyTo: selectedAccount.replyTo,
          },
          to: recipientEmail,
          subject,
          body,
          recordId: record.id,
          recordType,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || 'Send failed');

      // Save to history
      addEmailHistory({
        recordId: record.id,
        recordType,
        to: recipientEmail,
        subject,
        body,
        accountId: selectedAccount.id,
        accountEmail: selectedAccount.email,
        status: 'sent',
        messageId: data.messageId,
      });

      setPhase('sent');
      toast('success', 'Email Sent', `Email delivered to ${recipientEmail}`);
      setTimeout(onClose, 1800);
    } catch (err) {
      addEmailHistory({
        recordId: record.id,
        recordType,
        to: recipientEmail,
        subject,
        body,
        accountId: selectedAccount?.id || '',
        accountEmail: selectedAccount?.email || '',
        status: 'failed',
        errorMsg: err.message,
      });
      setErrorMsg(err.message);
      setPhase('error');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-xl animate-scale-in" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={17} style={{ color: '#fff' }} />
            </div>
            <div>
              <div className="modal-title">AI Email Generator</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                {recordType === 'publisher' ? `Outreach to ${record?.domain}` : `Sales pitch to ${record?.website}`}
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '20px' }}>

          {/* GENERATING */}
          {phase === 'generating' && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Loader2 size={44} style={{ color: '#8B5CF6', animation: 'spin 1s linear infinite', marginBottom: 16 }} />
              <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 6 }}>Generating personalized email…</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                AI is analyzing {record?.domain || record?.website} and crafting your message
              </div>
            </div>
          )}

          {/* SENDING */}
          {phase === 'sending' && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Loader2 size={44} style={{ color: '#3B82F6', animation: 'spin 1s linear infinite', marginBottom: 16 }} />
              <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 6 }}>Sending email…</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Connecting to {selectedAccount?.smtpHost}</div>
            </div>
          )}

          {/* SENT */}
          {phase === 'sent' && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <CheckCircle size={52} style={{ color: '#22C55E', marginBottom: 14 }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>Email Sent!</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Delivered to {recipientEmail}</div>
            </div>
          )}

          {/* ERROR */}
          {phase === 'error' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <AlertCircle size={44} style={{ color: '#DC2626', marginBottom: 14 }} />
              <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8, color: '#DC2626' }}>Something went wrong</div>
              <div style={{
                background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8,
                padding: '12px 16px', fontSize: '0.82rem', color: '#B91C1C', textAlign: 'left', marginBottom: 16,
              }}>
                {errorMsg}
              </div>
              {!aiSettings.apiKey && (
                <div style={{ fontSize: '0.82rem', color: '#92400E', background: '#FEF3C7', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
                  💡 <strong>Tip:</strong> Go to <strong>Settings → AI Prompt Settings</strong> and enter your Gemini or OpenAI API key.
                </div>
              )}
              <button className="btn btn-primary" onClick={generate}><RefreshCw size={14} /> Try Again</button>
            </div>
          )}

          {/* EDITOR */}
          {phase === 'editor' && (
            <div>
              {/* Recipient */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 14, padding: '10px 14px', background: 'var(--color-bg-hover)', borderRadius: 8, fontSize: '0.83rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>To:</span>
                {recipientEmail ? (
                  <span style={{ fontWeight: 600 }}>{recipientEmail}</span>
                ) : (
                  <span style={{ color: '#DC2626' }}>⚠ No email address in record — add one to enable sending</span>
                )}
              </div>

              {/* Subject */}
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Subject</label>
                <input
                  className="form-input"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Email subject..."
                  id="ai-email-subject"
                  style={{ fontWeight: 600 }}
                />
              </div>

              {/* Body */}
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Email Body</label>
                <textarea
                  className="form-textarea"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={12}
                  placeholder="Email body..."
                  id="ai-email-body"
                  style={{ fontSize: '0.88rem', lineHeight: 1.7, resize: 'vertical' }}
                />
              </div>

              {/* Send from selector */}
              {emailAccounts.length > 0 ? (
                <div style={{ padding: '12px 14px', background: 'var(--color-bg-hover)', borderRadius: 8, marginBottom: 6 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Send From</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {emailAccounts.map(acc => (
                      <label key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="send-from"
                          value={acc.id}
                          checked={selectedAccountId === acc.id}
                          onChange={() => setSelectedAccountId(acc.id)}
                          style={{ accentColor: '#7C3AED' }}
                          id={`send-from-${acc.id}`}
                        />
                        <span>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{acc.name || acc.email}</span>
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', marginLeft: 6 }}>{acc.email}</span>
                          {acc.isDefault && <span style={{ fontSize: '0.68rem', background: '#DBEAFE', color: '#1D4ED8', borderRadius: 4, padding: '1px 5px', marginLeft: 6 }}>Default</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '10px 14px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, fontSize: '0.82rem', color: '#92400E' }}>
                  ⚠ No email accounts configured. Go to <strong>Settings → Email Accounts</strong> to add one.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {phase === 'editor' && (
          <div className="modal-footer">
            <button className="btn btn-outline btn-sm" onClick={generate} id="ai-regenerate-btn">
              <RefreshCw size={13} /> Regenerate
            </button>
            <button className="btn btn-outline btn-sm" onClick={handleCopy} id="ai-copy-btn">
              {copied ? <CheckCircle size={13} style={{ color: '#22C55E' }} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <div style={{ flex: 1 }} />
            <button className="btn btn-outline" onClick={onClose} id="ai-cancel-btn">Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleSend}
              disabled={!recipientEmail || emailAccounts.length === 0}
              id="ai-send-btn"
              style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderColor: 'transparent' }}
            >
              <Send size={14} /> Send Email
            </button>
          </div>
        )}
        {phase === 'error' && (
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
