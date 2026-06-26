import React, { useState, useMemo } from 'react';
import {
  Plus, Download, Upload, Columns, Trash2,
  ChevronUp, ChevronDown, Edit, Search, ChevronsUpDown, Clock, Calendar, Star, ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../shared/StatusBadge';
import CountryTabs from '../shared/CountryTabs';
import EmptyState from '../shared/EmptyState';
import ConfirmModal from '../shared/ConfirmModal';
import ExportModal from '../shared/ExportModal';
import ImportModal from '../shared/ImportModal';
import LeadForm from './LeadForm';
import LeadPanel from './LeadPanel';
import { TagList } from '../shared/TagBadge';
import {
  formatNumber, formatDate, getStorage, setStorage,
  isFollowUpDue, isFollowUpOverdue,
} from '../../utils/helpers';

const PAGE_SIZE = 25;

const ALL_COLUMNS = [
  { key: 'website', label: 'Website' },
  { key: 'country', label: 'Country' },
  { key: 'niche', label: 'Niche' },
  { key: 'dr', label: 'DR' },
  { key: 'organicTraffic', label: 'Organic Traffic' },
  { key: 'avgSerpPosition', label: 'Avg SERP Pos.' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone / WhatsApp' },
  { key: 'lastContacted', label: 'Last Contacted' },
  { key: 'followUpDate', label: 'Follow-up Date' },
  { key: 'tags', label: 'Tags' },
  { key: 'status', label: 'Status' },
  { key: 'notes', label: 'Notes' },
];

const IMPORT_FIELDS = ALL_COLUMNS.map(c => ({ ...c, required: c.key === 'website' }));
const DEFAULT_VISIBLE = ['website', 'country', 'niche', 'dr', 'organicTraffic', 'email', 'lastContacted', 'followUpDate', 'tags', 'status'];

export default function LeadTable() {
  const { leads, bulkDeleteLeads, bulkUpdateLeadStatus, importLeads, deleteLead, toggleLeadStar, toast, config } = useApp();
  const allTags = config.tags || [];
  const LEAD_COUNTRIES = ['All', ...(config.countries || [])];
  const LEAD_STATUSES = config.leadStatuses || [];
  const NICHES = ['All', ...(config.niches || [])];

  const [country, setCountry] = useState('All');
  const [niche, setNiche] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: 'followUpDate', dir: 'asc' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [visibleCols, setVisibleCols] = useState(() => getStorage('lm_lead_cols', DEFAULT_VISIBLE));
  const [showColPanel, setShowColPanel] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [panelLead, setPanelLead] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [bulkStatusVal, setBulkStatusVal] = useState('');
  const [showBulkStatus, setShowBulkStatus] = useState(false);

  const saveVisibleCols = (cols) => { setVisibleCols(cols); setStorage('lm_lead_cols', cols); };

  const filtered = useMemo(() => {
    let data = leads;
    if (country !== 'All') data = data.filter(l => l.country === country);
    if (niche !== 'All') data = data.filter(l => l.niche === niche);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(l => Object.values(l).some(v => String(v || '').toLowerCase().includes(q)));
    }
    data = [...data].sort((a, b) => {
      let av = a[sort.key] ?? '';
      let bv = b[sort.key] ?? '';
      if (typeof av === 'number') return sort.dir === 'asc' ? av - bv : bv - av;
      return sort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return data;
  }, [leads, country, niche, search, sort]);

  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const columns = ALL_COLUMNS.filter(c => visibleCols.includes(c.key));

  const toggleSort = (key) => { setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }); setPage(1); };
  const toggleSelect = (id) => setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const toggleAll = () => { if (selected.size === pageData.length) setSelected(new Set()); else setSelected(new Set(pageData.map(l => l.id))); };

  const handleBulkDelete = () => { bulkDeleteLeads([...selected]); setSelected(new Set()); toast('success', 'Deleted', `${selected.size} leads deleted.`); };
  const handleBulkStatus = () => { if (!bulkStatusVal) return; bulkUpdateLeadStatus([...selected], bulkStatusVal); setSelected(new Set()); setShowBulkStatus(false); toast('success', 'Status Updated', `${selected.size} leads updated to "${bulkStatusVal}".`); };
  const handleImport = (records) => { const { added, skipped } = importLeads(records); toast('success', 'Import Complete', `${added} leads added, ${skipped} duplicates skipped.`); };
  const handleDeleteOne = (lead) => { setConfirmDelete(lead); setPanelLead(null); };
  const confirmDeleteOne = () => { deleteLead(confirmDelete.id); toast('success', 'Deleted', `${confirmDelete.website} removed.`); setConfirmDelete(null); };

  const SortIcon = ({ col }) => {
    if (sort.key !== col) return <ChevronsUpDown className="sort-icon" size={13} />;
    return sort.dir === 'asc' ? <ChevronUp className="sort-icon active" size={13} /> : <ChevronDown className="sort-icon active" size={13} />;
  };

  const renderCell = (col, lead) => {
    switch (col.key) {
      case 'website': {
        const href = lead.website && lead.website.startsWith('http') ? lead.website : `https://${lead.website}`;
        return (
          <span style={{ fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: lead.starred ? '#F59E0B' : 'var(--color-accent)', flexShrink: 0 }} />
            <a href={href} target="_blank" rel="noopener noreferrer" className="panel-link" style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
              {lead.website}
              <ExternalLink size={11} />
            </a>
          </span>
        );
      }
      case 'organicTraffic': return <span className="cell-metric">{formatNumber(lead.organicTraffic)}</span>;
      case 'avgSerpPosition': return <span className="cell-metric">{lead.avgSerpPosition ? `#${lead.avgSerpPosition}` : '—'}</span>;
      case 'tags': return <TagList tagIds={lead.tags || []} allTags={allTags} maxVisible={2} />;
      case 'status': return <StatusBadge status={lead.status} />;
      case 'lastContacted': return <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{formatDate(lead.lastContacted)}</span>;
      case 'followUpDate': {
        const due = isFollowUpDue(lead.followUpDate);
        const overdue = isFollowUpOverdue(lead.followUpDate);
        return (
          <span className={overdue ? 'cell-followup-overdue' : due ? 'cell-followup-due' : 'cell-followup-normal'}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem' }}>
            {(due || overdue) && <Clock size={12} />}
            {formatDate(lead.followUpDate)}
            {overdue && <span style={{ fontSize: '0.7rem' }}>⚠</span>}
          </span>
        );
      }
      case 'email': return <span style={{ fontSize: '0.82rem' }}>{lead.email || '—'}</span>;
      case 'notes': return <span className="truncate text-muted" style={{ maxWidth: 160, display: 'block', fontSize: '0.8rem' }}>{lead.notes || '—'}</span>;
      default: return <span>{lead[col.key] || '—'}</span>;
    }
  };

  return (
    <div>
      <CountryTabs countries={LEAD_COUNTRIES} activeCountry={country} onSelect={c => { setCountry(c); setPage(1); setSelected(new Set()); }} data={leads} />

      <div className="module-toolbar">
        <div className="toolbar-left">
          <div className="search-input-wrap">
            <Search className="search-icon" size={15} />
            <input id="lead-search" className="search-input" placeholder="Search leads..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="niche-select" value={niche} onChange={e => { setNiche(e.target.value); setPage(1); }} id="lead-niche-filter">
            {NICHES.map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div className="toolbar-right">
          <div style={{ position: 'relative' }}>
            <button className="btn btn-outline btn-sm" onClick={() => setShowColPanel(o => !o)} id="lead-columns-btn">
              <Columns size={14} /> Columns
            </button>
            {showColPanel && (
              <div className="col-visibility-panel">
                <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: 8 }}>Show/Hide Columns</div>
                {ALL_COLUMNS.map(col => (
                  <label key={col.key} className="col-visibility-item" htmlFor={`lead-col-${col.key}`}>
                    <input type="checkbox" id={`lead-col-${col.key}`} className="checkbox"
                      checked={visibleCols.includes(col.key)}
                      onChange={e => saveVisibleCols(e.target.checked ? [...visibleCols, col.key] : visibleCols.filter(k => k !== col.key))} />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setShowImport(true)} id="lead-import-btn"><Upload size={14} /> Import</button>
          <button className="btn btn-outline btn-sm" onClick={() => setShowExport(true)} id="lead-export-btn"><Download size={14} /> Export</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(true)} id="lead-add-btn"><Plus size={14} /> Add Lead</button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="bulk-actions-bar" style={{ marginBottom: 12 }}>
          <span className="bulk-selected-count">{selected.size} selected</span>
          <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none' }}
            onClick={() => setShowBulkStatus(o => !o)} id="lead-bulk-status-btn">Update Status</button>
          {showBulkStatus && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <select className="form-select" style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}
                value={bulkStatusVal} onChange={e => setBulkStatusVal(e.target.value)}>
                <option value="">Select status...</option>
                {LEAD_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <button className="btn btn-sm" style={{ background: 'var(--color-accent)', color: '#fff', border: 'none' }} onClick={handleBulkStatus}>Apply</button>
            </div>
          )}
          <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.8)', color: '#fff', border: 'none', marginLeft: 'auto' }}
            onClick={() => setConfirmDelete('bulk')} id="lead-bulk-delete-btn"><Trash2 size={13} /> Delete</button>
          <button className="btn btn-ghost btn-sm" style={{ color: 'rgba(255,255,255,0.7)' }} onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      <div className="table-container">
        <div className="table-scroll-wrap">
          <table>
            <thead>
              <tr>
                <th className="cell-check">
                  <input type="checkbox" className="checkbox" id="lead-select-all"
                    checked={pageData.length > 0 && selected.size === pageData.length} onChange={toggleAll} />
                </th>
                <th style={{ width: 32 }} title="Starred">⭐</th>
                {columns.map(col => (
                  <th key={col.key} onClick={() => toggleSort(col.key)}>
                    <div className="th-inner">{col.label}
                      {sort.key !== col.key ? <ChevronsUpDown className="sort-icon" size={13} />
                        : sort.dir === 'asc' ? <ChevronUp className="sort-icon active" size={13} />
                        : <ChevronDown className="sort-icon active" size={13} />}
                    </div>
                  </th>
                ))}
                <th style={{ width: 60 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr><td colSpan={columns.length + 2}>
                  <EmptyState title="No leads found" description="Add a new lead or adjust your filters."
                    actionLabel="Add Lead" onAction={() => setShowAddForm(true)} />
                </td></tr>
              ) : pageData.map(lead => (
                <tr key={lead.id}
                  className={selected.has(lead.id) ? 'selected' : panelLead?.id === lead.id ? 'row-active' : ''}
                  onClick={() => setPanelLead(lead)}>
                  <td className="cell-check" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" className="checkbox" id={`lead-row-${lead.id}`}
                      checked={selected.has(lead.id)} onChange={() => toggleSelect(lead.id)} />
                  </td>
                  <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                    <button onClick={() => toggleLeadStar(lead.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }} id={`lead-star-${lead.id}`}>
                      <Star size={14} fill={lead.starred ? '#F59E0B' : 'none'} color={lead.starred ? '#F59E0B' : '#CBD5E1'} />
                    </button>
                  </td>
                  {columns.map(col => <td key={col.key}>{renderCell(col, lead)}</td>)}
                  <td onClick={e => e.stopPropagation()}>
                    <div className="cell-actions">
                      <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => setEditingLead(lead)} id={`lead-edit-${lead.id}`}><Edit size={13} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Delete" onClick={() => handleDeleteOne(lead)} id={`lead-delete-${lead.id}`} style={{ color: 'var(--color-danger)' }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span className="table-count">Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} leads</span>
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page - 2 + i;
              if (p > totalPages) return null;
              return <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>;
            })}
            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
          </div>
        </div>
      </div>

      {showAddForm && <LeadForm onClose={() => setShowAddForm(false)} />}
      {editingLead && <LeadForm lead={editingLead} onClose={() => setEditingLead(null)} />}
      {panelLead && <LeadPanel lead={panelLead} onClose={() => setPanelLead(null)}
        onEdit={() => { setEditingLead(panelLead); setPanelLead(null); }}
        onDelete={() => handleDeleteOne(panelLead)} />}
      {showExport && <ExportModal columns={ALL_COLUMNS} data={filtered} filename="leads.csv" onClose={() => setShowExport(false)} />}
      {showImport && <ImportModal systemFields={IMPORT_FIELDS} onImport={handleImport} onClose={() => setShowImport(false)} entityName="leads" />}
      {confirmDelete === 'bulk' && <ConfirmModal title={`Delete ${selected.size} Leads?`} message="This action cannot be undone." confirmLabel="Delete All" onConfirm={() => { handleBulkDelete(); setConfirmDelete(null); }} onCancel={() => setConfirmDelete(null)} />}
      {confirmDelete && confirmDelete !== 'bulk' && <ConfirmModal title={`Delete "${confirmDelete.website}"?`} message="This lead will be permanently removed." onConfirm={confirmDeleteOne} onCancel={() => setConfirmDelete(null)} />}
    </div>
  );
}
