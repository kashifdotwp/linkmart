import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import TagInput from '../shared/TagInput';
import DuplicateModal from '../shared/DuplicateModal';

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Arabic', 'Hindi', 'Urdu', 'Chinese', 'Other'];

export default function PublisherForm({ publisher, onClose, onSave }) {
  const { addPublisher, updatePublisher, mergePublisher, toast, config } = useApp();

  const [form, setForm] = useState({
    domain: '', url: '', country: 'USA', language: 'English',
    dr: '', da: '', organicTraffic: '', referringDomains: '', backlinks: '', spamScore: '',
    niche: '', top5Topics: '', linkType: 'Guest Post', linkAttribute: 'Dofollow',
    sellerPrice: '', clientPrice: '',
    primaryContact: '', email: '', whatsapp: '',
    status: 'Active', tags: [], notes: '',
    ...(publisher || {}),
  });
  const [errors, setErrors] = useState({});
  const [dupData, setDupData] = useState(null); // { existing, incoming }

  const profit = (Number(form.clientPrice) || 0) - (Number(form.sellerPrice) || 0);
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.domain.trim()) e.domain = 'Domain is required';
    if (!form.url.trim()) e.url = 'URL is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (publisher) {
      updatePublisher(publisher.id, form);
      toast('success', 'Website Updated', `${form.domain} has been updated.`);
      onSave?.(); onClose();
      return;
    }

    const result = addPublisher(form);
    if (result.status === 'duplicate') {
      setDupData({ existing: result.existing, incoming: form });
    } else {
      toast('success', 'Website Added', `${form.domain} added to database.`);
      onSave?.(); onClose();
    }
  };

  // Duplicate resolution
  const handleDupSkip = () => { setDupData(null); onClose(); };
  const handleDupOverwrite = () => {
    updatePublisher(dupData.existing.id, { ...dupData.incoming, id: undefined });
    toast('success', 'Overwritten', `${dupData.existing.domain} has been overwritten.`);
    setDupData(null); onClose();
  };
  const handleDupMerge = () => {
    mergePublisher(dupData.existing.id, dupData.incoming);
    toast('success', 'Merged', `${dupData.existing.domain} records merged.`);
    setDupData(null); onClose();
  };

  const countries = (config.countries || []).filter(c => c !== 'All');
  const niches = config.niches || [];
  const linkTypes = config.linkTypes || [];
  const linkAttributes = config.linkAttributes || ['Dofollow', 'Nofollow', 'Sponsored', 'UGC'];
  const statuses = config.publisherStatuses || [];

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal modal-xl animate-scale-in" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">{publisher ? 'Edit Website' : 'Add Website'}</h2>
            <button className="modal-close" onClick={onClose}><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Website Info */}
              <div className="form-fieldset">
                <div className="form-fieldset-legend">Website Info</div>
                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Domain *</label>
                    <input className={`form-input ${errors.domain ? 'border-red' : ''}`} placeholder="techinsider.com"
                      value={form.domain} onChange={e => set('domain', e.target.value)} id="pub-domain" />
                    {errors.domain && <span className="form-error">{errors.domain}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">URL *</label>
                    <input className={`form-input ${errors.url ? 'border-red' : ''}`} placeholder="https://techinsider.com"
                      value={form.url} onChange={e => set('url', e.target.value)} id="pub-url" />
                    {errors.url && <span className="form-error">{errors.url}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <select className="form-select" value={form.country} onChange={e => set('country', e.target.value)} id="pub-country">
                      {countries.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Language</label>
                    <select className="form-select" value={form.language} onChange={e => set('language', e.target.value)} id="pub-language">
                      {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Niche</label>
                    <select className="form-select" value={form.niche} onChange={e => set('niche', e.target.value)} id="pub-niche">
                      <option value="">— Select Niche —</option>
                      {niches.map(n => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Top 5 Topics</label>
                    <input className="form-input" placeholder="AI, SaaS, Startups, Gadgets, Cloud"
                      value={form.top5Topics} onChange={e => set('top5Topics', e.target.value)} id="pub-topics" />
                  </div>
                </div>
              </div>

              {/* SEO Metrics */}
              <div className="form-fieldset">
                <div className="form-fieldset-legend">SEO Metrics</div>
                <div className="form-grid form-grid-3">
                  {[
                    { key: 'dr', label: 'DR', placeholder: '72' },
                    { key: 'da', label: 'DA', placeholder: '68' },
                    { key: 'spamScore', label: 'Spam Score', placeholder: '2' },
                    { key: 'organicTraffic', label: 'Organic Traffic', placeholder: '480000' },
                    { key: 'referringDomains', label: 'Referring Domains', placeholder: '3200' },
                    { key: 'backlinks', label: 'Backlinks', placeholder: '95000' },
                  ].map(({ key, label, placeholder }) => (
                    <div className="form-group" key={key}>
                      <label className="form-label">{label}</label>
                      <input type="number" className="form-input" placeholder={placeholder}
                        value={form[key]} onChange={e => set(key, e.target.value)} id={`pub-${key}`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="form-fieldset">
                <div className="form-fieldset-legend">Pricing & Link</div>
                <div className="form-grid form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Link Type</label>
                    <select className="form-select" value={form.linkType} onChange={e => set('linkType', e.target.value)} id="pub-linktype">
                      {linkTypes.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Link Attribute</label>
                    <select className="form-select" value={form.linkAttribute} onChange={e => set('linkAttribute', e.target.value)} id="pub-linkattr">
                      {linkAttributes.map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                  <div className="form-group" />
                  <div className="form-group">
                    <label className="form-label">Seller Price ($)</label>
                    <input type="number" className="form-input" placeholder="280"
                      value={form.sellerPrice} onChange={e => set('sellerPrice', e.target.value)} id="pub-seller-price" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Client Price ($)</label>
                    <input type="number" className="form-input" placeholder="450"
                      value={form.clientPrice} onChange={e => set('clientPrice', e.target.value)} id="pub-client-price" />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{
                      padding: '8px 14px', borderRadius: 8, fontSize: '0.88rem', fontWeight: 700,
                      background: profit >= 0 ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                      color: profit >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)',
                      width: '100%', textAlign: 'center',
                    }}>
                      Profit: {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="form-fieldset">
                <div className="form-fieldset-legend">Contact</div>
                <div className="form-grid form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Primary Contact</label>
                    <input className="form-input" placeholder="James Harper"
                      value={form.primaryContact} onChange={e => set('primaryContact', e.target.value)} id="pub-contact" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" placeholder="james@site.com"
                      value={form.email} onChange={e => set('email', e.target.value)} id="pub-email" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">WhatsApp</label>
                    <input className="form-input" placeholder="+1-555-0191"
                      value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} id="pub-whatsapp" />
                  </div>
                </div>
              </div>

              {/* Management */}
              <div className="form-fieldset">
                <div className="form-fieldset-legend">Management</div>
                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)} id="pub-status">
                      {statuses.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tags</label>
                    <TagInput value={form.tags} onChange={val => set('tags', val)} />
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: 14 }}>
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" rows={3} placeholder="Any notes about this website..."
                    value={form.notes} onChange={e => set('notes', e.target.value)} id="pub-notes" />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" id="pub-form-submit">
                {publisher ? 'Save Changes' : 'Add Website'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {dupData && (
        <DuplicateModal
          entityType="website"
          existing={dupData.existing}
          incoming={dupData.incoming}
          onSkip={handleDupSkip}
          onOverwrite={handleDupOverwrite}
          onMerge={handleDupMerge}
        />
      )}
    </>
  );
}
