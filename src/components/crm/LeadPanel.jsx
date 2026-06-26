import React, { useState } from 'react';
import { X, ExternalLink, Edit, Trash2, Mail, MessageCircle, Calendar, Clock, Sparkles, Star, ChevronDown, ChevronUp } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';
import { TagList } from '../shared/TagBadge';
import { formatDate, formatNumber, isFollowUpDue, isFollowUpOverdue } from '../../utils/helpers';
import { useApp } from '../../context/AppContext';
import AiEmailModal from '../email/AiEmailModal';
import EmailHistoryList from '../email/EmailHistoryList';

export default function LeadPanel({ lead, onClose, onEdit, onDelete }) {
  const { toggleLeadStar, config } = useApp();
  const [showAiEmail, setShowAiEmail] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (!lead) return null;
  const allTags = config.tags || [];
  const due = isFollowUpDue(lead.followUpDate);
  const overdue = isFollowUpOverdue(lead.followUpDate);

  return (
    <>
      <div className="side-panel-backdrop" onClick={onClose} />
      <aside className="side-panel animate-slide-right">
        {/* Header */}
        <div className="side-panel-header">
          <div style={{ flex: 1 }}>
            <div className="side-panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {lead.website}
              <button onClick={() => toggleLeadStar(lead.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                id="lead-panel-star-btn">
                <Star size={16} fill={lead.starred ? '#F59E0B' : 'none'} color={lead.starred ? '#F59E0B' : '#CBD5E1'} />
              </button>
            </div>
            <div className="side-panel-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <StatusBadge status={lead.status} />
              {overdue && <span className="badge badge-blacklisted">⚠ Overdue</span>}
              {due && !overdue && <span className="badge badge-expensive">Due Today</span>}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="side-panel-body">
          {/* Website Info */}
          <div className="panel-section">
            <div className="panel-section-title">Website Info</div>
            <Field label="Website" value={
              <a href={`https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="panel-link" onClick={e => e.stopPropagation()}>
                {lead.website} <ExternalLink size={11} />
              </a>
            } raw />
            <Field label="Country" value={lead.country} />
            <Field label="Niche" value={lead.niche} />
          </div>

          {/* SEO Metrics */}
          <div className="panel-section">
            <div className="panel-section-title">SEO Metrics</div>
            <Field label="DR" value={lead.dr || '—'} />
            <Field label="Organic Traffic" value={formatNumber(lead.organicTraffic)} />
            <Field label="Avg SERP Position" value={lead.avgSerpPosition ? `#${lead.avgSerpPosition}` : '—'} />
          </div>

          {/* Contact */}
          <div className="panel-section">
            <div className="panel-section-title">Contact</div>
            <Field label="Email" value={
              lead.email
                ? <a href={`mailto:${lead.email}`} className="panel-link"><Mail size={13} /> {lead.email}</a>
                : '—'
            } raw />
            <Field label="Phone / WhatsApp" value={
              lead.phone
                ? <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="panel-link" style={{ color: '#25D366' }}><MessageCircle size={13} /> {lead.phone}</a>
                : '—'
            } raw />
          </div>

          {/* Follow-up */}
          <div className="panel-section">
            <div className="panel-section-title">Follow-up</div>
            <Field label="Last Contacted" value={formatDate(lead.lastContacted)} />
            <Field label="Follow-up Date" value={
              <span style={{ color: overdue ? 'var(--color-danger-text)' : due ? 'var(--color-warning-text)' : 'inherit', fontWeight: (due || overdue) ? 700 : 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                {overdue || due ? <Clock size={13} /> : <Calendar size={13} />}
                {formatDate(lead.followUpDate)}
                {overdue && ' · Overdue!'}
                {due && !overdue && ' · Today!'}
              </span>
            } raw />
            <Field label="Status" value={<StatusBadge status={lead.status} />} raw />
          </div>

          {/* Tags */}
          {lead.tags?.length > 0 && (
            <div className="panel-section">
              <div className="panel-section-title">Tags</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
                <TagList tagIds={lead.tags} allTags={allTags} maxVisible={20} />
              </div>
            </div>
          )}

          {/* Notes */}
          {lead.notes && (
            <div className="panel-section">
              <div className="panel-section-title">Notes</div>
              <div className="panel-notes">{lead.notes}</div>
            </div>
          )}

          {/* Email History */}
          <div className="panel-section">
            <button className="panel-collapsible-title" onClick={() => setShowHistory(o => !o)} id="lead-panel-email-history-toggle">
              <div className="panel-section-title" style={{ margin: 0 }}>Email History</div>
              {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showHistory && (
              <div style={{ marginTop: 10 }}>
                <EmailHistoryList recordId={lead.id} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="side-panel-footer">
          <button className="btn btn-ai flex-1" onClick={() => setShowAiEmail(true)} id="lead-panel-ai-email-btn">
            <Sparkles size={14} /> AI Email
          </button>
          <button className="btn btn-outline flex-1" onClick={onEdit} id="lead-panel-edit-btn">
            <Edit size={15} /> Edit
          </button>
          <button className="btn btn-danger" onClick={onDelete} id="lead-panel-delete-btn">
            <Trash2 size={15} />
          </button>
        </div>
      </aside>

      {showAiEmail && (
        <AiEmailModal record={lead} recordType="lead" onClose={() => setShowAiEmail(false)} />
      )}
    </>
  );
}

function Field({ label, value, raw }) {
  return (
    <div className="panel-field">
      <span className="panel-field-label">{label}</span>
      {raw ? value : <span className="panel-field-value">{value || '—'}</span>}
    </div>
  );
}
