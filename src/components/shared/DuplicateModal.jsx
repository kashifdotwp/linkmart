import React from 'react';
import { AlertTriangle, GitMerge, SkipForward, RefreshCw, X } from 'lucide-react';

// Shows side-by-side comparison of existing vs new record
// Actions: Skip | Overwrite | Merge (fills empty fields from new into existing)
export default function DuplicateModal({ entityType = 'website', existing, incoming, onSkip, onOverwrite, onMerge }) {
  // Compute field diffs
  const allKeys = [...new Set([...Object.keys(existing || {}), ...Object.keys(incoming || {})])].filter(k =>
    !['id', 'lastUpdated', 'createdAt', 'profit'].includes(k)
  );

  const isDiff = (key) => {
    const ev = String(existing?.[key] || '').toLowerCase();
    const iv = String(incoming?.[key] || '').toLowerCase();
    return ev !== iv && iv !== '';
  };

  const fmt = (val) => {
    if (val === null || val === undefined || val === '') return <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>—</span>;
    if (Array.isArray(val)) return val.join(', ') || '—';
    return String(val);
  };

  const LABELS = {
    domain: 'Domain', url: 'URL', website: 'Website', country: 'Country',
    niche: 'Niche', language: 'Language', dr: 'DR', da: 'DA',
    organicTraffic: 'Organic Traffic', spamScore: 'Spam Score',
    linkType: 'Link Type', linkAttribute: 'Link Attribute',
    sellerPrice: 'Seller Price', clientPrice: 'Client Price',
    primaryContact: 'Contact', email: 'Email', whatsapp: 'WhatsApp',
    status: 'Status', tags: 'Tags', notes: 'Notes',
    phone: 'Phone', avgSerpPosition: 'Avg SERP Pos.',
    lastContacted: 'Last Contacted', followUpDate: 'Follow-up',
    starred: 'Starred',
  };

  const displayKeys = allKeys.filter(k => LABELS[k]);

  return (
    <div className="modal-backdrop" onClick={onSkip}>
      <div className="modal modal-xl animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--color-warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />
            </div>
            <div>
              <div className="modal-title">Duplicate {entityType === 'lead' ? 'Lead' : 'Website'} Detected</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                <strong>{existing?.domain || existing?.website}</strong> already exists in your database. Choose how to proceed:
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onSkip}><X size={18} /></button>
        </div>

        <div className="modal-body" style={{ padding: '16px 20px' }}>
          {/* Action explanation cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
            {[
              { icon: SkipForward, label: 'Skip', desc: 'Keep existing record as-is', color: '#9CA3AF', bg: '#F3F4F6', action: onSkip },
              { icon: RefreshCw, label: 'Overwrite', desc: 'Replace existing with new data', color: '#DC2626', bg: '#FEE2E2', action: onOverwrite },
              { icon: GitMerge, label: 'Merge', desc: 'Fill empty fields from new data', color: '#7C3AED', bg: '#EDE9FE', action: onMerge },
            ].map(({ icon: Icon, label, desc, color, bg, action }) => (
              <button key={label} onClick={action} style={{
                background: bg, border: `1.5px solid ${color}30`, borderRadius: 10, padding: '10px 14px',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}30`; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                  <Icon size={15} style={{ color }} />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color }}>{label}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{desc}</div>
              </button>
            ))}
          </div>

          {/* Comparison table */}
          <div style={{ border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden', fontSize: '0.82rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', background: 'var(--color-bg-hover)', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ padding: '8px 12px', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Field</div>
              <div style={{ padding: '8px 12px', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#2563EB' }}>Existing Record</div>
              <div style={{ padding: '8px 12px', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#7C3AED' }}>Incoming Record</div>
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {displayKeys.map(key => {
                const diff = isDiff(key);
                return (
                  <div key={key} style={{
                    display: 'grid', gridTemplateColumns: '140px 1fr 1fr',
                    borderBottom: '1px solid var(--color-border)',
                    background: diff ? 'rgba(251,191,36,0.06)' : 'transparent',
                  }}>
                    <div style={{ padding: '7px 12px', color: 'var(--color-text-secondary)', fontSize: '0.78rem', fontWeight: 600, borderRight: '1px solid var(--color-border)' }}>
                      {LABELS[key] || key}
                      {diff && <span style={{ marginLeft: 4, color: '#D97706', fontSize: '0.65rem' }}>●</span>}
                    </div>
                    <div style={{ padding: '7px 12px', borderRight: '1px solid var(--color-border)', wordBreak: 'break-all' }}>
                      {fmt(existing?.[key])}
                    </div>
                    <div style={{ padding: '7px 12px', wordBreak: 'break-all', color: diff ? '#7C3AED' : 'inherit', fontWeight: diff ? 600 : 400 }}>
                      {fmt(incoming?.[key])}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            <span style={{ color: '#D97706' }}>●</span> Fields highlighted in amber are different between records
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onSkip} id="dup-skip-btn"><SkipForward size={14} /> Skip</button>
          <button className="btn btn-danger" onClick={onOverwrite} id="dup-overwrite-btn"><RefreshCw size={14} /> Overwrite</button>
          <button className="btn btn-primary" onClick={onMerge} id="dup-merge-btn"><GitMerge size={14} /> Merge Records</button>
        </div>
      </div>
    </div>
  );
}
