import React, { useState, useMemo } from 'react';
import {
  Plus, Edit, Trash2, Download, Search, X,
  Briefcase, DollarSign, CheckCircle, Clock, FileText, Star, ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/shared/StatusBadge';
import ConfirmModal from '../components/shared/ConfirmModal';
import { formatDate, formatCurrency, generateId } from '../utils/helpers';

const STATUS_COLORS = {
  Won: { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' },
  Delivered: { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' },
  Invoiced: { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D' },
  Paid: { bg: '#F0FDF4', text: '#166534', border: '#4ADE80' },
};

const LINK_ATTRIBUTES = ['Dofollow', 'Nofollow', 'Sponsored', 'UGC'];
const ATTR_COLORS = { Dofollow: '#22C55E', Nofollow: '#9CA3AF', Sponsored: '#F59E0B', UGC: '#3B82F6' };

// ── Work Log Form Modal ──
function WorkLogForm({ entry, leads, publishers, onClose, onSave }) {
  const { addWorkLog, updateWorkLog, toast, config } = useApp();
  const [form, setForm] = useState({
    clientWebsite: '', linkedLeadId: '', publisherId: '',
    linkDelivered: '', anchorText: '', linkAttribute: 'Dofollow',
    invoiceAmount: '', status: 'Won', date: new Date().toISOString().split('T')[0],
    notes: '',
    ...(entry || {}),
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.clientWebsite.trim()) { toast('error', 'Error', 'Client website is required'); return; }
    if (entry) { updateWorkLog(entry.id, form); toast('success', 'Updated', `${form.clientWebsite} updated.`); }
    else { addWorkLog(form); toast('success', 'Added', `Delivery for ${form.clientWebsite} recorded.`); }
    onSave?.();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-xl animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{entry ? 'Edit Delivery Record' : 'Add Delivery Record'}</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-fieldset">
              <div className="form-fieldset-legend">Delivery Info</div>
              <div className="form-grid form-grid-2">
                <div className="form-group form-grid-full">
                  <label className="form-label">Client Website *</label>
                  <input className="form-input" placeholder="shopifystore.com" value={form.clientWebsite} onChange={e => set('clientWebsite', e.target.value)} id="wl-client" />
                </div>
                <div className="form-group">
                  <label className="form-label">Linked CRM Lead</label>
                  <select className="form-select" value={form.linkedLeadId} onChange={e => set('linkedLeadId', e.target.value)} id="wl-lead">
                    <option value="">— None —</option>
                    {leads.map(l => <option key={l.id} value={l.id}>{l.website}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Publisher Used</label>
                  <select className="form-select" value={form.publisherId} onChange={e => set('publisherId', e.target.value)} id="wl-pub">
                    <option value="">— None —</option>
                    {publishers.map(p => <option key={p.id} value={p.id}>{p.domain}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Link Delivered (URL)</label>
                  <input className="form-input" placeholder="https://site.com/post-with-link" value={form.linkDelivered} onChange={e => set('linkDelivered', e.target.value)} id="wl-link" />
                </div>
                <div className="form-group">
                  <label className="form-label">Anchor Text</label>
                  <input className="form-input" placeholder="best SEO tools" value={form.anchorText} onChange={e => set('anchorText', e.target.value)} id="wl-anchor" />
                </div>
                <div className="form-group">
                  <label className="form-label">Link Attribute</label>
                  <select className="form-select" value={form.linkAttribute} onChange={e => set('linkAttribute', e.target.value)} id="wl-attr">
                    {LINK_ATTRIBUTES.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-fieldset">
              <div className="form-fieldset-legend">Financial & Status</div>
              <div className="form-grid form-grid-3">
                <div className="form-group">
                  <label className="form-label">Invoice Amount ($)</label>
                  <input type="number" className="form-input" placeholder="500" value={form.invoiceAmount} onChange={e => set('invoiceAmount', e.target.value)} id="wl-invoice" />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)} id="wl-status">
                    {(config.workLogStatuses || ['Won', 'Delivered', 'Invoiced', 'Paid']).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={form.date} onChange={e => set('date', e.target.value)} id="wl-date" />
                </div>
              </div>
            </div>

            <div className="form-fieldset">
              <div className="form-fieldset-legend">Notes</div>
              <div className="form-group">
                <textarea className="form-textarea" rows={3} placeholder="Any notes about this delivery..." value={form.notes} onChange={e => set('notes', e.target.value)} id="wl-notes" />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" id="wl-submit">{entry ? 'Save Changes' : 'Add Record'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Work Log Page ──
export default function WorkLog() {
  const { workLog, deleteWorkLog, bulkDeleteWorkLog, publishers, leads, toast, config } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const statuses = ['All', ...(config.workLogStatuses || ['Won', 'Delivered', 'Invoiced', 'Paid'])];

  const filtered = useMemo(() => {
    let data = workLog;
    if (statusFilter !== 'All') data = data.filter(w => w.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(w => Object.values(w).some(v => String(v || '').toLowerCase().includes(q)));
    }
    return data;
  }, [workLog, statusFilter, search]);

  // Summary stats
  const totalAmount = workLog.reduce((s, w) => s + (Number(w.invoiceAmount) || 0), 0);
  const paidAmount = workLog.filter(w => w.status === 'Paid').reduce((s, w) => s + (Number(w.invoiceAmount) || 0), 0);
  const pendingAmount = workLog.filter(w => ['Invoiced'].includes(w.status)).reduce((s, w) => s + (Number(w.invoiceAmount) || 0), 0);
  const deliveredCount = workLog.filter(w => ['Delivered', 'Invoiced', 'Paid'].includes(w.status)).length;

  const cards = [
    { label: 'Total Deliveries', value: workLog.length, icon: Briefcase, color: '#0F2A44', bg: '#E8F0F8' },
    { label: 'Links Delivered', value: deliveredCount, icon: CheckCircle, color: '#22C55E', bg: '#DCFCE7' },
    { label: 'Revenue Invoiced', value: formatCurrency(totalAmount), icon: FileText, color: '#F59E0B', bg: '#FEF3C7', isStr: true },
    { label: 'Revenue Paid', value: formatCurrency(paidAmount), icon: DollarSign, color: '#16A34A', bg: '#DCFCE7', isStr: true },
    { label: 'Pending Payment', value: formatCurrency(pendingAmount), icon: Clock, color: '#DC2626', bg: '#FEE2E2', isStr: true },
  ];

  const toggleSelect = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => { if (selected.size === filtered.length) setSelected(new Set()); else setSelected(new Set(filtered.map(w => w.id))); };

  const handleDelete = (entry) => { deleteWorkLog(entry.id); toast('success', 'Deleted', `Delivery record removed.`); setConfirmDelete(null); };
  const handleBulkDelete = () => { bulkDeleteWorkLog([...selected]); setSelected(new Set()); toast('success', 'Deleted', `${selected.size} records removed.`); };

  const getPubName = (id) => publishers.find(p => p.id === id)?.domain || '—';
  const getLeadName = (id) => leads.find(l => l.id === id)?.website || '—';

  const StatusPill = ({ status }) => {
    const col = STATUS_COLORS[status] || STATUS_COLORS.Won;
    return <span style={{ ...col, padding: '2px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, border: `1px solid ${col.border}` }}>{status}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={17} style={{ color: '#7C3AED' }} />
            </span>
            Work Log
          </h1>
          <p className="page-subtitle">Track all delivered links, clients, invoices, and payment status</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)} id="wl-add-btn">
          <Plus size={14} /> Add Delivery Record
        </button>
      </div>

      {/* Summary cards */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)', marginBottom: 20 }}>
        {cards.map(({ label, value, icon: Icon, color, bg, isStr }) => (
          <div key={label} className="dashboard-card">
            <div className="card-icon-wrap" style={{ background: bg }}><Icon size={18} style={{ color }} /></div>
            <div className="card-label">{label}</div>
            <div className="card-value" style={{ fontSize: isStr ? '1.2rem' : '1.6rem' }}>{isStr ? value : value}</div>
          </div>
        ))}
      </div>

      {/* Status Tabs */}
      <div className="country-tabs" style={{ marginBottom: 14 }}>
        {statuses.map(s => (
          <button key={s} id={`wl-tab-${s}`}
            className={`country-tab ${statusFilter === s ? 'active' : ''}`}
            onClick={() => setStatusFilter(s)}>
            {s}
            <span className="country-tab-count">
              {s === 'All' ? workLog.length : workLog.filter(w => w.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="module-toolbar">
        <div className="toolbar-left">
          <div className="search-input-wrap">
            <Search className="search-icon" size={15} />
            <input className="search-input" placeholder="Search deliveries..." id="wl-search" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        {selected.size > 0 && (
          <div className="toolbar-right">
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{selected.size} selected</span>
            <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete('bulk')} id="wl-bulk-delete">
              <Trash2 size={13} /> Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="table-scroll-wrap">
          <table>
            <thead>
              <tr>
                <th className="cell-check">
                  <input type="checkbox" className="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleAll} id="wl-select-all" />
                </th>
                <th>Client Website</th>
                <th>Publisher Used</th>
                <th>Link Delivered</th>
                <th>Anchor Text</th>
                <th>Attribute</th>
                <th>Invoice</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ width: 60 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
                  No delivery records yet. Click <strong>Add Delivery Record</strong> to start tracking.
                </td></tr>
              ) : filtered.map(entry => (
                <tr key={entry.id} className={selected.has(entry.id) ? 'selected' : ''}>
                  <td className="cell-check" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" className="checkbox" checked={selected.has(entry.id)} onChange={() => toggleSelect(entry.id)} id={`wl-row-${entry.id}`} />
                  </td>
                  <td style={{ fontWeight: 600 }}>{entry.clientWebsite}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{getPubName(entry.publisherId)}</td>
                  <td>
                    {entry.linkDelivered
                      ? <a href={entry.linkDelivered} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem' }}>
                          View Link <ExternalLink size={11} />
                        </a>
                      : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>{entry.anchorText || '—'}</td>
                  <td>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: ATTR_COLORS[entry.linkAttribute] || '#9CA3AF' }}>
                      {entry.linkAttribute || '—'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{formatCurrency(entry.invoiceAmount)}</td>
                  <td><StatusPill status={entry.status} /></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{formatDate(entry.date)}</td>
                  <td>
                    <div className="cell-actions">
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditEntry(entry)} id={`wl-edit-${entry.id}`}><Edit size={13} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => setConfirmDelete(entry)} id={`wl-del-${entry.id}`}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span className="table-count">Showing {filtered.length} of {workLog.length} records</span>
        </div>
      </div>

      {/* Modals */}
      {showForm && <WorkLogForm leads={leads} publishers={publishers} onClose={() => setShowForm(false)} />}
      {editEntry && <WorkLogForm entry={editEntry} leads={leads} publishers={publishers} onClose={() => setEditEntry(null)} />}
      {confirmDelete && confirmDelete !== 'bulk' && (
        <ConfirmModal title="Delete Record?" message="This delivery record will be permanently removed."
          onConfirm={() => handleDelete(confirmDelete)} onCancel={() => setConfirmDelete(null)} />
      )}
      {confirmDelete === 'bulk' && (
        <ConfirmModal title={`Delete ${selected.size} Records?`} message="Selected delivery records will be permanently removed."
          confirmLabel="Delete All" onConfirm={() => { handleBulkDelete(); setConfirmDelete(null); }} onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  );
}
