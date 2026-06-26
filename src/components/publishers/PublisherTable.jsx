import React, { useState, useMemo } from 'react';
import {
  Plus, Download, Upload, Columns, Trash2,
  ChevronUp, ChevronDown, Edit, Search,
  ChevronsUpDown, SlidersHorizontal, X, Filter, Star, ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../shared/StatusBadge';
import CountryTabs from '../shared/CountryTabs';
import EmptyState from '../shared/EmptyState';
import ConfirmModal from '../shared/ConfirmModal';
import ExportModal from '../shared/ExportModal';
import ImportModal from '../shared/ImportModal';
import PublisherForm from './PublisherForm';
import PublisherPanel from './PublisherPanel';
import { TagList } from '../shared/TagBadge';
import { formatNumber, formatCurrency, formatDate, getStorage, setStorage } from '../../utils/helpers';

const ATTR_COLORS = { Dofollow: '#22C55E', Nofollow: '#9CA3AF', Sponsored: '#F59E0B', UGC: '#3B82F6' };
const ATTR_BG = { Dofollow: '#DCFCE7', Nofollow: '#F3F4F6', Sponsored: '#FEF3C7', UGC: '#DBEAFE' };
const PAGE_SIZE = 25;

const ALL_COLUMNS = [
  { key: 'domain', label: 'Domain' },
  { key: 'url', label: 'URL' },
  { key: 'country', label: 'Country' },
  { key: 'language', label: 'Language' },
  { key: 'dr', label: 'DR' },
  { key: 'da', label: 'DA' },
  { key: 'organicTraffic', label: 'Organic Traffic' },
  { key: 'referringDomains', label: 'Ref. Domains' },
  { key: 'backlinks', label: 'Backlinks' },
  { key: 'spamScore', label: 'Spam Score' },
  { key: 'niche', label: 'Niche' },
  { key: 'top5Topics', label: 'Top 5 Topics' },
  { key: 'linkType', label: 'Link Type' },
  { key: 'linkAttribute', label: 'Do/No Follow' },
  { key: 'tags', label: 'Tags' },
  { key: 'sellerPrice', label: 'Seller Price' },
  { key: 'clientPrice', label: 'Client Price' },
  { key: 'profit', label: 'Profit' },
  { key: 'primaryContact', label: 'Contact' },
  { key: 'email', label: 'Email' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'status', label: 'Status' },
  { key: 'lastUpdated', label: 'Last Updated' },
  { key: 'notes', label: 'Notes' },
];

const IMPORT_FIELDS = ALL_COLUMNS.map(c => ({ ...c, required: c.key === 'domain' }));
const DEFAULT_VISIBLE = ['domain', 'country', 'dr', 'da', 'organicTraffic', 'niche', 'linkType', 'linkAttribute', 'tags', 'sellerPrice', 'clientPrice', 'profit', 'status', 'lastUpdated'];

const EMPTY_FILTERS = {
  niche: 'All',
  status: 'All',
  linkType: 'All',
  linkAttribute: 'All',
  starredOnly: false,
  drMin: '', drMax: '',
  daMin: '', daMax: '',
  trafficMin: '', trafficMax: '',
  spamMax: '',
  sellerMin: '', sellerMax: '',
  clientMin: '', clientMax: '',
  profitMin: '', profitMax: '',
};

export default function PublisherTable() {
  const { publishers, bulkDeletePublishers, bulkUpdatePublisherStatus, importPublishers, deletePublisher, togglePublisherStar, toast, config } = useApp();
  const allTags = config.tags || [];
  const PUBLISHER_COUNTRIES = ['All', ...(config.countries || [])];
  const PUBLISHER_STATUSES = config.publisherStatuses || [];
  const LINK_TYPES = config.linkTypes || [];
  const NICHES = config.niches || [];
  const LINK_ATTRIBUTES = config.linkAttributes || ['Dofollow', 'Nofollow', 'Sponsored', 'UGC'];

  // ── State ──
  const [country, setCountry] = useState('All');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState({ key: 'lastUpdated', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [visibleCols, setVisibleCols] = useState(() => getStorage('lm_pub_cols', DEFAULT_VISIBLE));
  const [showColPanel, setShowColPanel] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPub, setEditingPub] = useState(null);
  const [panelPub, setPanelPub] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [bulkStatusVal, setBulkStatusVal] = useState('');
  const [showBulkStatus, setShowBulkStatus] = useState(false);

  const setF = (key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1); };
  const saveVisibleCols = (cols) => { setVisibleCols(cols); setStorage('lm_pub_cols', cols); };

  // ── Active filter count ──
  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v && v !== 'All' && v !== '' && v !== false).length;

  // ── Active filter labels for badge row ──
  const activeFilterBadges = [];
  if (filters.starredOnly) activeFilterBadges.push({ key: 'starredOnly', label: '⭐ Starred Only' });
  if (filters.niche !== 'All') activeFilterBadges.push({ key: 'niche', label: `Niche: ${filters.niche}` });
  if (filters.status !== 'All') activeFilterBadges.push({ key: 'status', label: `Status: ${filters.status}` });
  if (filters.linkType !== 'All') activeFilterBadges.push({ key: 'linkType', label: `Type: ${filters.linkType}` });
  if (filters.linkAttribute !== 'All') activeFilterBadges.push({ key: 'linkAttribute', label: `Attr: ${filters.linkAttribute}` });
  if (filters.drMin || filters.drMax) activeFilterBadges.push({ key: 'dr', label: `DR: ${filters.drMin || '0'}–${filters.drMax || '100'}` });
  if (filters.daMin || filters.daMax) activeFilterBadges.push({ key: 'da', label: `DA: ${filters.daMin || '0'}–${filters.daMax || '100'}` });
  if (filters.trafficMin || filters.trafficMax) activeFilterBadges.push({ key: 'traffic', label: `Traffic: ${filters.trafficMin || '0'}–${filters.trafficMax || '∞'}` });
  if (filters.spamMax) activeFilterBadges.push({ key: 'spamMax', label: `Spam ≤ ${filters.spamMax}` });
  if (filters.sellerMin || filters.sellerMax) activeFilterBadges.push({ key: 'seller', label: `Seller: $${filters.sellerMin || '0'}–$${filters.sellerMax || '∞'}` });
  if (filters.clientMin || filters.clientMax) activeFilterBadges.push({ key: 'client', label: `Client: $${filters.clientMin || '0'}–$${filters.clientMax || '∞'}` });
  if (filters.profitMin || filters.profitMax) activeFilterBadges.push({ key: 'profit', label: `Profit: $${filters.profitMin || '0'}–$${filters.profitMax || '∞'}` });

  const removeBadge = (key) => {
    const map = {
      starredOnly: { starredOnly: false },
      niche: { niche: 'All' }, status: { status: 'All' },
      linkType: { linkType: 'All' }, linkAttribute: { linkAttribute: 'All' },
      dr: { drMin: '', drMax: '' }, da: { daMin: '', daMax: '' },
      traffic: { trafficMin: '', trafficMax: '' }, spamMax: { spamMax: '' },
      seller: { sellerMin: '', sellerMax: '' }, client: { clientMin: '', clientMax: '' },
      profit: { profitMin: '', profitMax: '' },
    };
    setFilters(f => ({ ...f, ...(map[key] || {}) }));
    setPage(1);
  };

  // ── Filter + sort data ──
  const filtered = useMemo(() => {
    let data = publishers;

    if (country !== 'All') data = data.filter(p => p.country === country);
    if (filters.starredOnly) data = data.filter(p => p.starred);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(p => Object.values(p).some(v => String(v || '').toLowerCase().includes(q)));
    }
    if (filters.niche !== 'All') data = data.filter(p => p.niche === filters.niche);
    if (filters.status !== 'All') data = data.filter(p => p.status === filters.status);
    if (filters.linkType !== 'All') data = data.filter(p => p.linkType === filters.linkType);
    if (filters.linkAttribute !== 'All') data = data.filter(p => p.linkAttribute === filters.linkAttribute);
    if (filters.drMin !== '') data = data.filter(p => Number(p.dr) >= Number(filters.drMin));
    if (filters.drMax !== '') data = data.filter(p => Number(p.dr) <= Number(filters.drMax));
    if (filters.daMin !== '') data = data.filter(p => Number(p.da) >= Number(filters.daMin));
    if (filters.daMax !== '') data = data.filter(p => Number(p.da) <= Number(filters.daMax));
    if (filters.trafficMin !== '') data = data.filter(p => Number(p.organicTraffic) >= Number(filters.trafficMin));
    if (filters.trafficMax !== '') data = data.filter(p => Number(p.organicTraffic) <= Number(filters.trafficMax));
    if (filters.spamMax !== '') data = data.filter(p => Number(p.spamScore) <= Number(filters.spamMax));
    if (filters.sellerMin !== '') data = data.filter(p => Number(p.sellerPrice) >= Number(filters.sellerMin));
    if (filters.sellerMax !== '') data = data.filter(p => Number(p.sellerPrice) <= Number(filters.sellerMax));
    if (filters.clientMin !== '') data = data.filter(p => Number(p.clientPrice) >= Number(filters.clientMin));
    if (filters.clientMax !== '') data = data.filter(p => Number(p.clientPrice) <= Number(filters.clientMax));
    if (filters.profitMin !== '') data = data.filter(p => Number(p.profit) >= Number(filters.profitMin));
    if (filters.profitMax !== '') data = data.filter(p => Number(p.profit) <= Number(filters.profitMax));

    // Starred always float to top
    data = [...data].sort((a, b) => {
      if (a.starred && !b.starred) return -1;
      if (!a.starred && b.starred) return 1;
      let av = a[sort.key] ?? ''; let bv = b[sort.key] ?? '';
      if (!isNaN(av) && !isNaN(bv) && av !== '' && bv !== '')
        return sort.dir === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av);
      return sort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return data;
  }, [publishers, country, search, filters, sort]);

  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const columns = ALL_COLUMNS.filter(c => visibleCols.includes(c.key));

  const toggleSort = (key) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
    setPage(1);
  };
  const toggleSelect = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => { if (selected.size === pageData.length) setSelected(new Set()); else setSelected(new Set(pageData.map(p => p.id))); };

  const handleBulkDelete = () => { bulkDeletePublishers([...selected]); setSelected(new Set()); toast('success', 'Deleted', `${selected.size} websites deleted.`); };
  const handleBulkStatus = () => {
    if (!bulkStatusVal) return;
    bulkUpdatePublisherStatus([...selected], bulkStatusVal);
    setSelected(new Set()); setShowBulkStatus(false);
    toast('success', 'Status Updated', `${selected.size} websites updated to "${bulkStatusVal}".`);
  };
  const handleImport = (records) => { const { added, skipped } = importPublishers(records); toast('success', 'Import Complete', `${added} added, ${skipped} duplicates skipped.`); };
  const handleDeleteOne = (pub) => { setConfirmDelete(pub); setPanelPub(null); };
  const confirmDeleteOne = () => { deletePublisher(confirmDelete.id); toast('success', 'Deleted', `${confirmDelete.domain} removed.`); setConfirmDelete(null); };

  const SortIcon = ({ col }) => {
    if (sort.key !== col) return <ChevronsUpDown className="sort-icon" size={13} />;
    return sort.dir === 'asc' ? <ChevronUp className="sort-icon active" size={13} /> : <ChevronDown className="sort-icon active" size={13} />;
  };

  const renderCell = (col, pub) => {
    switch (col.key) {
      case 'domain': {
        const href = pub.url || (pub.domain && pub.domain.startsWith('http') ? pub.domain : `https://${pub.domain}`);
        return (
          <span className="cell-domain" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: pub.starred ? '#F59E0B' : 'var(--color-accent)', flexShrink: 0 }} />
            <a href={href} target="_blank" rel="noopener noreferrer" className="panel-link" style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
              {pub.domain}
              <ExternalLink size={11} />
            </a>
          </span>
        );
      }
      case 'url': {
        if (!pub.url) return <span>—</span>;
        return (
          <a href={pub.url} target="_blank" rel="noopener noreferrer" className="panel-link cell-url" title={pub.url} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
            <span className="truncate" style={{ maxWidth: 150 }}>{pub.url}</span>
            <ExternalLink size={11} />
          </a>
        );
      }
      case 'organicTraffic': case 'referringDomains': case 'backlinks':
        return <span className="cell-metric">{formatNumber(pub[col.key])}</span>;
      case 'sellerPrice': case 'clientPrice':
        return <span className="cell-metric">{formatCurrency(pub[col.key])}</span>;
      case 'profit': {
        const p = Number(pub.profit) || 0;
        return <span className={p >= 0 ? 'cell-profit-positive' : 'cell-profit-negative'}>{p >= 0 ? '+' : ''}{formatCurrency(p)}</span>;
      }
      case 'linkAttribute': {
        const attr = pub.linkAttribute || 'Dofollow';
        return (
          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999,
            background: ATTR_BG[attr] || '#F3F4F6', color: ATTR_COLORS[attr] || '#9CA3AF' }}>
            {attr}
          </span>
        );
      }
      case 'tags': return <TagList tagIds={pub.tags || []} allTags={allTags} maxVisible={2} />;
      case 'status': return <StatusBadge status={pub.status} />;
      case 'lastUpdated': return <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{formatDate(pub.lastUpdated)}</span>;
      case 'notes': return <span className="truncate text-muted" style={{ maxWidth: 180, display: 'block', fontSize: '0.8rem' }}>{pub.notes || '—'}</span>;
      default: return <span>{pub[col.key] || '—'}</span>;
    }
  };

  return (
    <div>
      {/* Country Tabs */}
      <CountryTabs countries={PUBLISHER_COUNTRIES} activeCountry={country}
        onSelect={c => { setCountry(c); setPage(1); setSelected(new Set()); }} data={publishers} />

      {/* Toolbar */}
      <div className="module-toolbar">
        <div className="toolbar-left">
          <div className="search-input-wrap">
            <Search className="search-icon" size={15} />
            <input id="pub-search" className="search-input" placeholder="Search websites..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>

          {/* Starred filter */}
          <button
            className={`btn btn-sm ${filters.starredOnly ? 'btn-accent' : 'btn-outline'}`}
            onClick={() => setF('starredOnly', !filters.starredOnly)}
            id="pub-starred-filter"
          >
            <Star size={14} fill={filters.starredOnly ? 'currentColor' : 'none'} />
            Starred
          </button>

          {/* Filters toggle button */}
          <button
            className={`btn btn-sm ${showFilters || activeFilterCount > 0 ? 'btn-accent' : 'btn-outline'}`}
            onClick={() => setShowFilters(o => !o)}
            id="pub-filter-toggle"
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span style={{ background: '#fff', color: 'var(--color-accent)', borderRadius: 9999, padding: '0 5px', fontSize: '0.7rem', fontWeight: 800, marginLeft: 2 }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger-text)', fontSize: '0.78rem' }}
              onClick={() => { setFilters(EMPTY_FILTERS); setPage(1); }} id="pub-clear-filters">
              <X size={13} /> Clear
            </button>
          )}
        </div>

        <div className="toolbar-right">
          {/* Column visibility */}
          <div style={{ position: 'relative' }}>
            <button className="btn btn-outline btn-sm" onClick={() => setShowColPanel(o => !o)} id="pub-columns-btn">
              <Columns size={14} /> Columns
            </button>
            {showColPanel && (
              <div className="col-visibility-panel">
                <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Show/Hide Columns</span>
                  <button className="btn-ghost" style={{ fontSize: '0.75rem', border: 'none', cursor: 'pointer', background: 'none', color: 'var(--color-text-muted)' }} onClick={() => setShowColPanel(false)}>✕</button>
                </div>
                {ALL_COLUMNS.map(col => (
                  <label key={col.key} className="col-visibility-item" htmlFor={`pub-col-${col.key}`}>
                    <input type="checkbox" id={`pub-col-${col.key}`} className="checkbox"
                      checked={visibleCols.includes(col.key)}
                      onChange={e => saveVisibleCols(e.target.checked ? [...visibleCols, col.key] : visibleCols.filter(k => k !== col.key))} />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setShowImport(true)} id="pub-import-btn"><Upload size={14} /> Import</button>
          <button className="btn btn-outline btn-sm" onClick={() => setShowExport(true)} id="pub-export-btn"><Download size={14} /> Export</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(true)} id="pub-add-btn">
            <Plus size={14} /> Add Website
          </button>
        </div>
      </div>

      {/* ── Advanced Filter Panel ── */}
      {showFilters && (
        <div className="adv-filter-panel">
          <div className="adv-filter-title">
            <Filter size={13} />
            Advanced Filters
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', fontSize: '0.75rem', padding: '2px 8px' }}
              onClick={() => { setFilters(EMPTY_FILTERS); setPage(1); }}>
              Reset All
            </button>
          </div>
          <div className="adv-filter-grid">

            {/* Niche */}
            <div className="filter-group">
              <label className="filter-group-label">Niche</label>
              <select className="filter-select" value={filters.niche} onChange={e => setF('niche', e.target.value)} id="filter-niche">
                <option value="All">All Niches</option>
                {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {/* Status */}
            <div className="filter-group">
              <label className="filter-group-label">Status</label>
              <select className="filter-select" value={filters.status} onChange={e => setF('status', e.target.value)} id="filter-status">
                <option value="All">All Statuses</option>
                {PUBLISHER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Link Type */}
            <div className="filter-group">
              <label className="filter-group-label">Link Type</label>
              <select className="filter-select" value={filters.linkType} onChange={e => setF('linkType', e.target.value)} id="filter-linktype">
                <option value="All">All Types</option>
                {LINK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Link Attribute */}
            <div className="filter-group">
              <label className="filter-group-label">Do/No Follow</label>
              <select className="filter-select" value={filters.linkAttribute} onChange={e => setF('linkAttribute', e.target.value)} id="filter-linkattr">
                <option value="All">All Attributes</option>
                {LINK_ATTRIBUTES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* DR Range */}
            <div className="filter-group">
              <label className="filter-group-label">DR Range</label>
              <div className="filter-range-row">
                <input type="number" className="filter-input" placeholder="Min" min="0" max="100"
                  value={filters.drMin} onChange={e => setF('drMin', e.target.value)} id="filter-dr-min" />
                <span className="filter-range-sep">–</span>
                <input type="number" className="filter-input" placeholder="Max" min="0" max="100"
                  value={filters.drMax} onChange={e => setF('drMax', e.target.value)} id="filter-dr-max" />
              </div>
            </div>

            {/* DA Range */}
            <div className="filter-group">
              <label className="filter-group-label">DA Range</label>
              <div className="filter-range-row">
                <input type="number" className="filter-input" placeholder="Min" min="0" max="100"
                  value={filters.daMin} onChange={e => setF('daMin', e.target.value)} id="filter-da-min" />
                <span className="filter-range-sep">–</span>
                <input type="number" className="filter-input" placeholder="Max" min="0" max="100"
                  value={filters.daMax} onChange={e => setF('daMax', e.target.value)} id="filter-da-max" />
              </div>
            </div>

            {/* Spam Score */}
            <div className="filter-group">
              <label className="filter-group-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Spam Score Max</span>
                {filters.spamMax !== '' && <span className="filter-range-value">{filters.spamMax}</span>}
              </label>
              <input type="range" className="filter-range-slider" min="0" max="20" step="1"
                value={filters.spamMax !== '' ? filters.spamMax : 20}
                onChange={e => setF('spamMax', e.target.value === '20' ? '' : e.target.value)}
                id="filter-spam-max" />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                <span>0</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>
                  {filters.spamMax !== '' ? `≤ ${filters.spamMax}` : 'Any'}
                </span>
                <span>20</span>
              </div>
            </div>

            {/* Organic Traffic Range */}
            <div className="filter-group">
              <label className="filter-group-label">Organic Traffic</label>
              <div className="filter-range-row">
                <input type="number" className="filter-input" placeholder="Min" min="0"
                  value={filters.trafficMin} onChange={e => setF('trafficMin', e.target.value)} id="filter-traffic-min" />
                <span className="filter-range-sep">–</span>
                <input type="number" className="filter-input" placeholder="Max"
                  value={filters.trafficMax} onChange={e => setF('trafficMax', e.target.value)} id="filter-traffic-max" />
              </div>
            </div>

            {/* Seller Price Range */}
            <div className="filter-group">
              <label className="filter-group-label">Seller Price ($)</label>
              <div className="filter-range-row">
                <input type="number" className="filter-input" placeholder="Min $" min="0"
                  value={filters.sellerMin} onChange={e => setF('sellerMin', e.target.value)} id="filter-seller-min" />
                <span className="filter-range-sep">–</span>
                <input type="number" className="filter-input" placeholder="Max $"
                  value={filters.sellerMax} onChange={e => setF('sellerMax', e.target.value)} id="filter-seller-max" />
              </div>
            </div>

            {/* Client Price Range */}
            <div className="filter-group">
              <label className="filter-group-label">Client Price ($)</label>
              <div className="filter-range-row">
                <input type="number" className="filter-input" placeholder="Min $" min="0"
                  value={filters.clientMin} onChange={e => setF('clientMin', e.target.value)} id="filter-client-min" />
                <span className="filter-range-sep">–</span>
                <input type="number" className="filter-input" placeholder="Max $"
                  value={filters.clientMax} onChange={e => setF('clientMax', e.target.value)} id="filter-client-max" />
              </div>
            </div>

            {/* Profit Range */}
            <div className="filter-group">
              <label className="filter-group-label">Profit ($)</label>
              <div className="filter-range-row">
                <input type="number" className="filter-input" placeholder="Min $"
                  value={filters.profitMin} onChange={e => setF('profitMin', e.target.value)} id="filter-profit-min" />
                <span className="filter-range-sep">–</span>
                <input type="number" className="filter-input" placeholder="Max $"
                  value={filters.profitMax} onChange={e => setF('profitMax', e.target.value)} id="filter-profit-max" />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Active filter badges */}
      {activeFilterBadges.length > 0 && (
        <div className="active-filters-row">
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, marginRight: 2 }}>Filters:</span>
          {activeFilterBadges.map(b => (
            <span key={b.key} className="active-filter-badge">
              {b.label}
              <button className="active-filter-badge-close" onClick={() => removeBadge(b.key)} title="Remove filter">×</button>
            </span>
          ))}
        </div>
      )}

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="bulk-actions-bar" style={{ marginBottom: 12 }}>
          <span className="bulk-selected-count">{selected.size} selected</span>
          <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none' }}
            onClick={() => setShowBulkStatus(o => !o)} id="pub-bulk-status-btn">Update Status</button>
          {showBulkStatus && (
            <div style={{ display: 'flex', gap: 6 }}>
              <select className="form-select" style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}
                value={bulkStatusVal} onChange={e => setBulkStatusVal(e.target.value)}>
                <option value="">Select status...</option>
                {PUBLISHER_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <button className="btn btn-sm" style={{ background: 'var(--color-accent)', color: '#fff', border: 'none' }} onClick={handleBulkStatus}>Apply</button>
            </div>
          )}
          <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.8)', color: '#fff', border: 'none', marginLeft: 'auto' }}
            onClick={() => setConfirmDelete('bulk')} id="pub-bulk-delete-btn"><Trash2 size={13} /> Delete</button>
          <button className="btn btn-ghost btn-sm" style={{ color: 'rgba(255,255,255,0.7)' }} onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <div className="table-scroll-wrap">
          <table>
            <thead>
              <tr>
                <th className="cell-check">
                  <input type="checkbox" className="checkbox" id="pub-select-all"
                    checked={pageData.length > 0 && selected.size === pageData.length} onChange={toggleAll} />
                </th>
                <th style={{ width: 32 }} title="Starred">⭐</th>
                {columns.map(col => (
                  <th key={col.key} onClick={() => toggleSort(col.key)}>
                    <div className="th-inner">{col.label}<SortIcon col={col.key} /></div>
                  </th>
                ))}
                <th style={{ width: 60 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr><td colSpan={columns.length + 2}>
                  <EmptyState title="No websites found" description="Try adjusting your filters or country tab."
                    actionLabel="Add Website" onAction={() => setShowAddForm(true)} />
                </td></tr>
              ) : pageData.map(pub => (
                <tr key={pub.id}
                  className={selected.has(pub.id) ? 'selected' : panelPub?.id === pub.id ? 'row-active' : ''}
                  onClick={() => setPanelPub(pub)}>
                  <td className="cell-check" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" className="checkbox" id={`pub-row-${pub.id}`}
                      checked={selected.has(pub.id)} onChange={() => toggleSelect(pub.id)} />
                  </td>
                  <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                    <button onClick={() => togglePublisherStar(pub.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }} id={`pub-star-${pub.id}`} title={pub.starred ? 'Unstar' : 'Star'}>
                      <Star size={14} fill={pub.starred ? '#F59E0B' : 'none'} color={pub.starred ? '#F59E0B' : '#CBD5E1'} />
                    </button>
                  </td>
                  {columns.map(col => <td key={col.key}>{renderCell(col, pub)}</td>)}
                  <td onClick={e => e.stopPropagation()}>
                    <div className="cell-actions">
                      <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => setEditingPub(pub)} id={`pub-edit-${pub.id}`}><Edit size={13} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Delete" onClick={() => handleDeleteOne(pub)} id={`pub-delete-${pub.id}`} style={{ color: 'var(--color-danger)' }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="table-footer">
          <span className="table-count">
            Showing {filtered.length === 0 ? 0 : Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} websites
            {activeFilterCount > 0 && ` (filtered from ${publishers.length})`}
          </span>
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

      {/* Modals & Panels */}
      {showAddForm && <PublisherForm onClose={() => setShowAddForm(false)} />}
      {editingPub && <PublisherForm publisher={editingPub} onClose={() => setEditingPub(null)} />}
      {panelPub && (
        <PublisherPanel publisher={panelPub} onClose={() => setPanelPub(null)}
          onEdit={() => { setEditingPub(panelPub); setPanelPub(null); }}
          onDelete={() => handleDeleteOne(panelPub)} />
      )}
      {showExport && <ExportModal columns={ALL_COLUMNS} data={filtered} filename="publishers.csv" onClose={() => setShowExport(false)} />}
      {showImport && <ImportModal systemFields={IMPORT_FIELDS} onImport={handleImport} onClose={() => setShowImport(false)} entityName="websites" />}
      {confirmDelete === 'bulk' && (
        <ConfirmModal title={`Delete ${selected.size} Websites?`} message="This cannot be undone." confirmLabel="Delete All"
          onConfirm={() => { handleBulkDelete(); setConfirmDelete(null); }} onCancel={() => setConfirmDelete(null)} />
      )}
      {confirmDelete && confirmDelete !== 'bulk' && (
        <ConfirmModal title={`Delete "${confirmDelete.domain}"?`} message="This website will be permanently removed."
          onConfirm={confirmDeleteOne} onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  );
}
