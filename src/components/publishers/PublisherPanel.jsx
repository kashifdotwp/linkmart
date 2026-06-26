import React, { useState } from 'react';
import { X, ExternalLink, Edit, Trash2, Mail, MessageCircle, Star, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';
import { TagList } from '../shared/TagBadge';
import { formatDate, formatNumber, formatCurrency } from '../../utils/helpers';
import { useApp } from '../../context/AppContext';
import AiEmailModal from '../email/AiEmailModal';
import EmailHistoryList from '../email/EmailHistoryList';

const ATTR_COLORS = { Dofollow: '#22C55E', Nofollow: '#9CA3AF', Sponsored: '#F59E0B', UGC: '#3B82F6' };
const ATTR_BG = { Dofollow: '#DCFCE7', Nofollow: '#F3F4F6', Sponsored: '#FEF3C7', UGC: '#DBEAFE' };

export default function PublisherPanel({ publisher, onClose, onEdit, onDelete }) {
  const { togglePublisherStar, config } = useApp();
  const [showAiEmail, setShowAiEmail] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (!publisher) return null;

  const profit = Number(publisher.profit) || 0;
  const allTags = config.tags || [];
  const attr = publisher.linkAttribute || 'Dofollow';

  return (
    <>
      <div className="side-panel-backdrop" onClick={onClose} />
      <aside className="side-panel animate-slide-right">
        {/* Header */}
        <div className="side-panel-header">
          <div style={{ flex: 1 }}>
            <div className="side-panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {publisher.domain}
              <button onClick={() => togglePublisherStar(publisher.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                id="panel-star-btn" title={publisher.starred ? 'Unstar' : 'Star'}>
                <Star size={16} fill={publisher.starred ? '#F59E0B' : 'none'} color={publisher.starred ? '#F59E0B' : '#CBD5E1'} />
              </button>
            </div>
            <div className="side-panel-subtitle">
              <StatusBadge status={publisher.status} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: ATTR_BG[attr], color: ATTR_COLORS[attr], marginLeft: 6 }}>
                {attr}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="side-panel-body">
          {/* Website Info */}
          <div className="panel-section">
            <div className="panel-section-title">Website Info</div>
            <Field label="Domain" value={
              <a href={publisher.url || `https://${publisher.domain}`} target="_blank" rel="noopener noreferrer"
                className="panel-link" onClick={e => e.stopPropagation()}>
                {publisher.domain} <ExternalLink size={11} />
              </a>
            } raw />
            <Field label="URL" value={
              <a href={publisher.url} target="_blank" rel="noopener noreferrer"
                className="panel-link" onClick={e => e.stopPropagation()}>
                {publisher.url} <ExternalLink size={11} />
              </a>
            } raw />
            <Field label="Country" value={publisher.country} />
            <Field label="Language" value={publisher.language} />
            <Field label="Niche" value={publisher.niche} />
            <Field label="Top 5 Topics" value={publisher.top5Topics} />
          </div>

          {/* SEO Metrics */}
          <div className="panel-section">
            <div className="panel-section-title">SEO Metrics</div>
            <Field label="DR" value={publisher.dr || '—'} />
            <Field label="DA" value={publisher.da || '—'} />
            <Field label="Organic Traffic" value={formatNumber(publisher.organicTraffic)} />
            <Field label="Referring Domains" value={formatNumber(publisher.referringDomains)} />
            <Field label="Backlinks" value={formatNumber(publisher.backlinks)} />
            <Field label="Spam Score" value={publisher.spamScore ?? '—'} />
            <Field label="Last Updated" value={formatDate(publisher.lastUpdated)} />
          </div>

          {/* Pricing */}
          <div className="panel-section">
            <div className="panel-section-title">Pricing</div>
            <Field label="Link Type" value={publisher.linkType} />
            <Field label="Link Attribute" value={
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: ATTR_BG[attr], color: ATTR_COLORS[attr] }}>{attr}</span>
            } raw />
            <Field label="Seller Price" value={formatCurrency(publisher.sellerPrice)} />
            <Field label="Client Price" value={formatCurrency(publisher.clientPrice)} />
            <Field label="Profit" value={
              <span style={{ color: profit >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)', fontWeight: 700 }}>
                {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
              </span>
            } raw />
          </div>

          {/* Contact */}
          <div className="panel-section">
            <div className="panel-section-title">Contact</div>
            <Field label="Primary Contact" value={publisher.primaryContact} />
            <Field label="Email" value={
              publisher.email
                ? <a href={`mailto:${publisher.email}`} className="panel-link"><Mail size={13} /> {publisher.email}</a>
                : '—'
            } raw />
            <Field label="WhatsApp" value={
              publisher.whatsapp
                ? <a href={`https://wa.me/${publisher.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="panel-link" style={{ color: '#25D366' }}><MessageCircle size={13} /> {publisher.whatsapp}</a>
                : '—'
            } raw />
          </div>

          {/* Tags */}
          {publisher.tags?.length > 0 && (
            <div className="panel-section">
              <div className="panel-section-title">Tags</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
                <TagList tagIds={publisher.tags} allTags={allTags} maxVisible={20} />
              </div>
            </div>
          )}

          {/* Notes */}
          {publisher.notes && (
            <div className="panel-section">
              <div className="panel-section-title">Notes</div>
              <div className="panel-notes">{publisher.notes}</div>
            </div>
          )}

          {/* Email History */}
          <div className="panel-section">
            <button className="panel-collapsible-title" onClick={() => setShowHistory(o => !o)} id="panel-email-history-toggle">
              <div className="panel-section-title" style={{ margin: 0 }}>Email History</div>
              {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showHistory && (
              <div style={{ marginTop: 10 }}>
                <EmailHistoryList recordId={publisher.id} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="side-panel-footer">
          <button className="btn btn-ai flex-1" onClick={() => setShowAiEmail(true)} id="panel-ai-email-btn">
            <Sparkles size={14} /> AI Email
          </button>
          <button className="btn btn-outline flex-1" onClick={onEdit} id="panel-edit-btn">
            <Edit size={15} /> Edit
          </button>
          <button className="btn btn-danger" onClick={onDelete} id="panel-delete-btn">
            <Trash2 size={15} />
          </button>
        </div>
      </aside>

      {showAiEmail && (
        <AiEmailModal record={publisher} recordType="publisher" onClose={() => setShowAiEmail(false)} />
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
