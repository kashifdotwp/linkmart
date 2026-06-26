import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import TagInput from '../shared/TagInput';
import DuplicateModal from '../shared/DuplicateModal';

export default function LeadForm({ lead, onClose }) {
  const { addLead, updateLead, mergeLead, toast, config } = useApp();
  const [form, setForm] = useState({
    website: '', country: 'USA', niche: '',
    dr: '', organicTraffic: '', avgSerpPosition: '',
    email: '', phone: '',
    lastContacted: '', followUpDate: '',
    status: 'New', tags: [], notes: '',
    ...(lead || {}),
  });
  const [errors, setErrors] = useState({});
  const [dupData, setDupData] = useState(null);
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const countries = (config.countries || []).filter(c => c !== 'All');
  const niches = config.niches || [];
  const statuses = config.leadStatuses || [];

  const validate = () => {
    const e = {};
    if (!form.website.trim()) e.website = 'Website is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (lead) {
      updateLead(lead.id, form);
      toast('success', 'Lead Updated', `${form.website} updated.`);
      onClose();
      return;
    }
    const result = addLead(form);
    if (result.status === 'duplicate') {
      setDupData({ existing: result.existing, incoming: form });
    } else {
      toast('success', 'Lead Added', `${form.website} added to CRM.`);
      onClose();
    }
  };

  const handleDupSkip = () => { setDupData(null); onClose(); };
  const handleDupOverwrite = () => {
    updateLead(dupData.existing.id, { ...dupData.incoming, id: undefined });
    toast('success', 'Overwritten', `${dupData.existing.website} has been overwritten.`);
    setDupData(null); onClose();
  };
  const handleDupMerge = () => {
    mergeLead(dupData.existing.id, dupData.incoming);
    toast('success', 'Merged', `${dupData.existing.website} records merged.`);
    setDupData(null); onClose();
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal modal-lg animate-scale-in" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">{lead ? 'Edit Lead' : 'Add Lead'}</h2>
            <button className="modal-close" onClick={onClose}><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Website Info */}
              <div className="form-fieldset">
                <div className="form-fieldset-legend">Website Info</div>
                <div className="form-grid form-grid-3">
                  <div className="form-group form-grid-full">
                    <label className="form-label">Website *</label>
                    <input className={`form-input ${errors.website ? 'border-red' : ''}`}
                      placeholder="shopifystore.com" value={form.website}
                      onChange={e => set('website', e.target.value)} id="lead-website" />
                    {errors.website && <span className="form-error">{errors.website}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <select className="form-select" value={form.country} onChange={e => set('country', e.target.value)} id="lead-country">
                      {countries.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Niche</label>
                    <select className="form-select" value={form.niche} onChange={e => set('niche', e.target.value)} id="lead-niche">
                      <option value="">— Select Niche —</option>
                      {niches.map(n => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* SEO Metrics */}
              <div className="form-fieldset">
                <div className="form-fieldset-legend">SEO Metrics</div>
                <div className="form-grid form-grid-3">
                  <div className="form-group">
                    <label className="form-label">DR</label>
                    <input type="number" className="form-input" placeholder="42" value={form.dr} onChange={e => set('dr', e.target.value)} id="lead-dr" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Organic Traffic</label>
                    <input type="number" className="form-input" placeholder="85000" value={form.organicTraffic} onChange={e => set('organicTraffic', e.target.value)} id="lead-traffic" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Avg SERP Position</label>
                    <input type="number" className="form-input" placeholder="18" value={form.avgSerpPosition} onChange={e => set('avgSerpPosition', e.target.value)} id="lead-serp" />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="form-fieldset">
                <div className="form-fieldset-legend">Contact</div>
                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" placeholder="hello@site.com" value={form.email} onChange={e => set('email', e.target.value)} id="lead-email" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone / WhatsApp</label>
                    <input className="form-input" placeholder="+1-888-555-0101" value={form.phone} onChange={e => set('phone', e.target.value)} id="lead-phone" />
                  </div>
                </div>
              </div>

              {/* Follow-up */}
              <div className="form-fieldset">
                <div className="form-fieldset-legend">Follow-up & Status</div>
                <div className="form-grid form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Last Contacted</label>
                    <input type="date" className="form-input"
                      value={form.lastContacted ? form.lastContacted.split('T')[0] : ''}
                      onChange={e => set('lastContacted', e.target.value ? new Date(e.target.value).toISOString() : '')} id="lead-last-contacted" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Follow-up Date</label>
                    <input type="date" className="form-input"
                      value={form.followUpDate ? form.followUpDate.split('T')[0] : ''}
                      onChange={e => set('followUpDate', e.target.value ? new Date(e.target.value).toISOString() : '')} id="lead-followup-date" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)} id="lead-status">
                      {statuses.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="form-fieldset">
                <div className="form-fieldset-legend">Tags</div>
                <div className="form-group">
                  <TagInput value={form.tags} onChange={val => set('tags', val)} />
                </div>
              </div>

              {/* Notes */}
              <div className="form-fieldset">
                <div className="form-fieldset-legend">Notes</div>
                <div className="form-group">
                  <textarea className="form-textarea" rows={3} placeholder="Notes about this lead..." value={form.notes} onChange={e => set('notes', e.target.value)} id="lead-notes" />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" id="lead-form-submit">
                {lead ? 'Save Changes' : 'Add Lead'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {dupData && (
        <DuplicateModal
          entityType="lead"
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
