import React from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/helpers';

export default function EmailHistoryList({ recordId }) {
  const { getEmailHistoryForRecord } = useApp();
  const history = getEmailHistoryForRecord(recordId);

  if (!history.length) {
    return (
      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', padding: '8px 0', fontStyle: 'italic' }}>
        No emails sent yet from this record.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {history.map(entry => (
        <div key={entry.id} className="email-history-item">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {entry.status === 'sent'
              ? <CheckCircle size={14} style={{ color: '#22C55E', flexShrink: 0 }} />
              : <XCircle size={14} style={{ color: '#DC2626', flexShrink: 0 }} />
            }
            <span className="email-history-subject" title={entry.subject}>{entry.subject}</span>
            <span className={`email-history-badge ${entry.status === 'sent' ? 'badge-sent' : 'badge-failed'}`}>
              {entry.status === 'sent' ? 'Sent' : 'Failed'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 3, paddingLeft: 22, flexWrap: 'wrap' }}>
            <span className="email-history-meta">
              <Clock size={10} style={{ marginRight: 3, flexShrink: 0 }} />
              {formatDate(entry.sentAt, true)}
            </span>
            <span className="email-history-meta">To: {entry.to}</span>
            {entry.accountEmail && (
              <span className="email-history-meta">Via: {entry.accountEmail}</span>
            )}
          </div>
          {entry.status === 'failed' && entry.errorMsg && (
            <div style={{
              fontSize: '0.72rem', color: '#B91C1C', background: '#FEF2F2',
              border: '1px solid #FCA5A5', borderRadius: 5, padding: '4px 8px', marginTop: 5, marginLeft: 22,
            }}>
              {entry.errorMsg}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
