import React, { useState, useRef, useMemo } from 'react';
import Papa from 'papaparse';
import {
  Layers, Upload, X, Check, Database, Users, Eye, Trash2, ArrowUpRight,
  Sheet, AlertCircle, FileSpreadsheet, Calendar, Link, HardDriveDownload,
  ChevronUp, ChevronDown, ChevronsUpDown, Download, CheckSquare, Square,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Pagination, { loadPageSize } from '../components/shared/Pagination';
import ConfirmModal from '../components/shared/ConfirmModal';

const PUBLISHER_FIELDS = [
  { key: 'domain', label: 'Domain *', required: true },
  { key: 'url', label: 'URL *', required: true },
  { key: 'country', label: 'Country', required: false },
  { key: 'language', label: 'Language', required: false },
  { key: 'dr', label: 'DR', required: false },
  { key: 'da', label: 'DA', required: false },
  { key: 'organicTraffic', label: 'Organic Traffic', required: false },
  { key: 'niche', label: 'Niche', required: false },
  { key: 'linkType', label: 'Link Type', required: false },
  { key: 'linkAttribute', label: 'Link Attribute (Do/No Follow)', required: false },
  { key: 'sellerPrice', label: 'Seller Price', required: false },
  { key: 'clientPrice', label: 'Client Price', required: false },
  { key: 'primaryContact', label: 'Contact Name', required: false },
  { key: 'email', label: 'Contact Email', required: false },
  { key: 'whatsapp', label: 'Contact WhatsApp', required: false },
  { key: 'notes', label: 'Notes', required: false },
];

const LEAD_FIELDS = [
  { key: 'website', label: 'Website *', required: true },
  { key: 'country', label: 'Country', required: false },
  { key: 'niche', label: 'Niche', required: false },
  { key: 'dr', label: 'DR', required: false },
  { key: 'organicTraffic', label: 'Organic Traffic', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'phone', label: 'Phone / WhatsApp', required: false },
  { key: 'notes', label: 'Notes', required: false },
];

export default function DataCenter() {
  const {
    dataSheets, addDataSheet, deleteDataSheet, mergeDataSheetToDatabase,
    mergeSelectedRowsToDatabase, updateDataSheetRows, toast
  } = useApp();

  // Modals / Dialogs states
  const [showUpload, setShowUpload] = useState(false);
  const [viewingSheet, setViewingSheet] = useState(null); // full-page sheet viewer
  const [mergingId, setMergingId] = useState(null);
  const [confirmDeleteSheet, setConfirmDeleteSheet] = useState(null);
  const [confirmRemerge, setConfirmRemerge] = useState(null);

  // Table sort for sheets list
  const [sheetSort, setSheetSort] = useState({ key: 'uploadedAt', dir: 'desc' });

  // Upload wizard states
  const [wizardStep, setWizardStep] = useState(1); // 1 = Upload & Metadata, 2 = Mapping
  const [fileError, setFileError] = useState('');
  const [rawHeaders, setRawHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [sheetName, setSheetName] = useState('');
  const [sheetSource, setSheetSource] = useState('Fiverr'); // Default resource
  const [targetType, setTargetType] = useState('publisher'); // publisher | lead
  const [mappings, setMappings] = useState({}); // targetKey -> rawHeader

  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  // ─── CSV File Reader ───
  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processCsvFile(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) processCsvFile(file);
  };

  const processCsvFile = (file) => {
    if (!file.name.endsWith('.csv')) {
      setFileError('Please select a valid .csv file.');
      return;
    }
    setFileError('');
    setSheetName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          setFileError('CSV file has no data rows.');
          return;
        }
        const headers = Object.keys(results.data[0]);
        setRawHeaders(headers);
        setRawRows(results.data);

        // Auto-map headers
        const fields = targetType === 'publisher' ? PUBLISHER_FIELDS : LEAD_FIELDS;
        const autoMappings = {};
        fields.forEach(f => {
          const matchedHeader = headers.find(h =>
            h.toLowerCase() === f.key.toLowerCase() ||
            h.toLowerCase() === f.label.toLowerCase().replace(' *', '').toLowerCase()
          );
          if (matchedHeader) autoMappings[f.key] = matchedHeader;
        });
        setMappings(autoMappings);
        setWizardStep(2);
      },
      error: (err) => {
        setFileError(`Failed to parse CSV: ${err.message}`);
      }
    });
  };

  const handleSaveSheet = () => {
    // Validate required mappings
    const fields = targetType === 'publisher' ? PUBLISHER_FIELDS : LEAD_FIELDS;
    const missingRequired = fields
      .filter(f => f.required)
      .filter(f => !mappings[f.key]);

    if (missingRequired.length > 0) {
      toast('error', 'Missing Mappings', `Please map the required field(s): ${missingRequired.map(f => f.label).join(', ')}`);
      return;
    }

    addDataSheet({
      name: sheetName,
      source: sheetSource,
      targetType: targetType,
      rowCount: rawRows.length,
      headers: rawHeaders,
      mappings: mappings,
      rows: rawRows,
    });

    toast('success', 'Sheet Added', `"${sheetName}" added to Data Center.`);
    setShowUpload(false);
    resetWizard();
  };

  const handleMergeSheet = async (sheet) => {
    setMergingId(sheet.id);
    setTimeout(() => {
      const res = mergeDataSheetToDatabase(sheet.id, sheet.targetType);
      setMergingId(null);
      if (res.status === 'ok') {
        toast('success', 'Merge Complete', `Successfully merged ${res.added} records to database. (${res.skipped} duplicates skipped).`);
      } else {
        toast('error', 'Merge Failed', res.message || 'Error occurred during merge.');
      }
    }, 800);
  };

  const handleRemerge = (sheet) => {
    if (sheet.status !== 'Imported') {
      setConfirmRemerge(sheet);
    } else {
      handleMergeSheet(sheet);
    }
  };

  const resetWizard = () => {
    setWizardStep(1);
    setFileError('');
    setRawHeaders([]);
    setRawRows([]);
    setSheetName('');
    setSheetSource('Fiverr');
    setTargetType('publisher');
    setMappings({});
  };

  const fieldsToMap = targetType === 'publisher' ? PUBLISHER_FIELDS : LEAD_FIELDS;

  // ── Sort sheets list ──
  const sortedSheets = useMemo(() => {
    return [...dataSheets].sort((a, b) => {
      let av = a[sheetSort.key] ?? '';
      let bv = b[sheetSort.key] ?? '';
      if (sheetSort.key === 'rowCount') {
        return sheetSort.dir === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av);
      }
      return sheetSort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [dataSheets, sheetSort]);

  const toggleSheetSort = (key) => {
    setSheetSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };

  const SheetSortIcon = ({ col }) => {
    if (sheetSort.key !== col) return <ChevronsUpDown className="sort-icon" size={13} />;
    return sheetSort.dir === 'asc' ? <ChevronUp className="sort-icon active" size={13} /> : <ChevronDown className="sort-icon active" size={13} />;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={17} style={{ color: 'var(--color-primary)' }} />
            </span>
            Data Center
          </h1>
          <p className="page-subtitle">Import spreadsheet lists from external resources, map columns, and merge them into CRM or Publishers list</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { resetWizard(); setShowUpload(true); }} id="upload-sheet-btn">
          <Upload size={14} /> Upload Sheet
        </button>
      </div>

      {/* Sheets Table */}
      {dataSheets.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px', background: 'var(--color-bg-card)',
          border: '2px dashed var(--color-border)', borderRadius: 12, marginTop: 10
        }}>
          <FileSpreadsheet size={44} style={{ color: 'var(--color-text-muted)', marginBottom: 12 }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>No Data Sheets Yet</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', maxWidth: 400, margin: '0 auto 18px' }}>
            Import raw CSV sheets from Fiverr sellers, custom scrapers, or outsource managers, map the columns, and merge them safely.
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => { resetWizard(); setShowUpload(true); }}>
            <Upload size={14} /> Upload Your First CSV
          </button>
        </div>
      ) : (
        <div className="table-container" style={{ marginTop: 10 }}>
          <div className="table-scroll-wrap">
            <table>
              <thead>
                <tr>
                  <th onClick={() => toggleSheetSort('name')} style={{ cursor: 'pointer' }}>
                    <div className="th-inner">Name <SheetSortIcon col="name" /></div>
                  </th>
                  <th onClick={() => toggleSheetSort('targetType')} style={{ cursor: 'pointer' }}>
                    <div className="th-inner">Type <SheetSortIcon col="targetType" /></div>
                  </th>
                  <th onClick={() => toggleSheetSort('source')} style={{ cursor: 'pointer' }}>
                    <div className="th-inner">Source <SheetSortIcon col="source" /></div>
                  </th>
                  <th onClick={() => toggleSheetSort('rowCount')} style={{ cursor: 'pointer' }}>
                    <div className="th-inner">Rows <SheetSortIcon col="rowCount" /></div>
                  </th>
                  <th onClick={() => toggleSheetSort('status')} style={{ cursor: 'pointer' }}>
                    <div className="th-inner">Status <SheetSortIcon col="status" /></div>
                  </th>
                  <th onClick={() => toggleSheetSort('uploadedAt')} style={{ cursor: 'pointer' }}>
                    <div className="th-inner">Uploaded <SheetSortIcon col="uploadedAt" /></div>
                  </th>
                  <th style={{ width: 200, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedSheets.map(sheet => (
                  <tr key={sheet.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Sheet size={16} style={{ color: sheet.targetType === 'publisher' ? 'var(--color-accent)' : '#7C3AED', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }} title={sheet.name}>
                          {sheet.name.length > 35 ? sheet.name.slice(0, 35) + '…' : sheet.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4,
                        background: sheet.targetType === 'publisher' ? '#FEF3C7' : '#F3E8FF',
                        color: sheet.targetType === 'publisher' ? '#B45309' : '#6D28D9'
                      }}>
                        {sheet.targetType === 'publisher' ? 'Publisher DB' : 'CRM Leads'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{sheet.source}</td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{sheet.rowCount}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginLeft: 4 }}>rows</span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                        background: sheet.status === 'Imported' ? 'rgba(201,162,77,0.12)' : 'rgba(34,197,94,0.1)',
                        color: sheet.status === 'Imported' ? 'var(--color-accent)' : '#16A34A'
                      }}>
                        {sheet.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      {new Date(sheet.uploadedAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button className="btn btn-outline btn-xs" onClick={() => setViewingSheet(sheet)} title="View Raw Data">
                          <Eye size={12} /> View
                        </button>
                        <button
                          className="btn btn-primary btn-xs"
                          disabled={mergingId === sheet.id}
                          onClick={() => handleRemerge(sheet)}
                          title={sheet.status !== 'Imported' ? 'Re-merge (skips duplicates)' : 'Merge to Database'}
                        >
                          {mergingId === sheet.id ? (
                            <Spinner size={12} />
                          ) : sheet.status !== 'Imported' ? (
                            <RotateCcw size={12} />
                          ) : (
                            <HardDriveDownload size={12} />
                          )}
                          {sheet.status === 'Imported' ? 'Merge' : 'Re-merge'}
                        </button>
                        <button
                          className="btn btn-outline btn-xs"
                          style={{ color: 'var(--color-danger-text)' }}
                          onClick={() => setConfirmDeleteSheet(sheet)}
                          title="Delete Sheet"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODAL: UPLOAD & MAPPING WIZARD ─── */}
      {showUpload && (
        <div className="modal-backdrop" onClick={() => setShowUpload(false)}>
          <div className="modal modal-lg animate-scale-in" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="modal-header">
              <h2 className="modal-title">Upload and Map Spreadsheet</h2>
              <button className="modal-close" onClick={() => setShowUpload(false)}><X size={18} /></button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {wizardStep === 1 ? (
                /* STEP 1: Upload + Metadata */
                <div>
                  <div className="form-grid form-grid-2" style={{ marginBottom: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Resource Source (e.g. Fiverr Seller, Custom Scraper)</label>
                      <input
                        className="form-input"
                        placeholder="e.g. Fiverr Seller, Outsource, Outreach-List"
                        value={sheetSource}
                        onChange={e => setSheetSource(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Target Database Type</label>
                      <select
                        className="form-select"
                        value={targetType}
                        onChange={e => setTargetType(e.target.value)}
                      >
                        <option value="publisher">Publisher Backlink Database</option>
                        <option value="lead">Client Hunting CRM (Leads)</option>
                      </select>
                    </div>
                  </div>

                  {/* Drag Drop Area */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleFileDrop}
                    style={{
                      border: `2px dashed ${dragOver ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
                      background: dragOver ? 'var(--color-bg-hover)' : 'transparent',
                      borderRadius: 8, padding: '40px 20px', textAlign: 'center', cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={32} style={{ color: 'var(--color-text-muted)', marginBottom: 10 }} />
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 4 }}>
                      Drag and drop your spreadsheet here, or <span style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>Browse files</span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>Supports .csv files only</div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".csv"
                      style={{ display: 'none' }}
                    />
                  </div>

                  {fileError && (
                    <div style={{
                      marginTop: 14, background: '#FEF2F2', border: '1px solid #FCA5A5',
                      borderRadius: 6, padding: '8px 12px', fontSize: '0.8rem', color: '#B91C1C',
                      display: 'flex', alignItems: 'center', gap: 6
                    }}>
                      <AlertCircle size={15} />
                      {fileError}
                    </div>
                  )}
                </div>
              ) : (
                /* STEP 2: COLUMN MAPPING */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--color-bg-hover)', borderRadius: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: '0.82rem' }}>
                      File: <strong>{sheetName}</strong> ({rawRows.length} rows)
                    </span>
                    <button className="btn-ghost" style={{ fontSize: '0.78rem', color: 'var(--color-accent)', border: 'none', cursor: 'pointer' }} onClick={() => setWizardStep(1)}>
                      ← Change File
                    </button>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 14 }}>
                    Map columns from your sheet to the target Link Mart database fields. Fields marked with an asterisk (<strong>*</strong>) are required.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 350, overflowY: 'auto', paddingRight: 4 }}>
                    {fieldsToMap.map(field => (
                      <div key={field.key} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center', gap: 12, paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                          {field.label}
                        </div>
                        <select
                          className="form-select"
                          value={mappings[field.key] || ''}
                          onChange={e => setMappings(m => ({ ...m, [field.key]: e.target.value }))}
                        >
                          <option value="">-- Do not import / Map header --</option>
                          {rawHeaders.map(header => (
                            <option key={header} value={header}>{header}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowUpload(false)}>Close</button>
              {wizardStep === 2 && (
                <button className="btn btn-primary" onClick={handleSaveSheet}>
                  <Check size={14} /> Import to Data Center
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── FULL-PAGE SHEET VIEWER ─── */}
      {viewingSheet && (
        <SheetViewer
          sheet={viewingSheet}
          onClose={() => setViewingSheet(null)}
          mergeSelectedRowsToDatabase={mergeSelectedRowsToDatabase}
          updateDataSheetRows={updateDataSheetRows}
          toast={toast}
        />
      )}

      {/* ─── Confirm Delete Sheet ─── */}
      {confirmDeleteSheet && (
        <ConfirmModal
          title={`Delete "${confirmDeleteSheet.name}"?`}
          message="This will permanently remove the sheet from the Data Center. Rows already merged into the database will remain."
          confirmLabel="Delete Sheet"
          onConfirm={() => { deleteDataSheet(confirmDeleteSheet.id); setConfirmDeleteSheet(null); toast('success', 'Deleted', 'Sheet removed from Data Center.'); }}
          onCancel={() => setConfirmDeleteSheet(null)}
        />
      )}

      {/* ─── Confirm Re-merge ─── */}
      {confirmRemerge && (
        <ConfirmModal
          title={`Re-merge "${confirmRemerge.name}"?`}
          message="This sheet was already merged. Re-merging will skip existing duplicates and only add new records."
          confirmLabel="Re-merge"
          onConfirm={() => { handleMergeSheet(confirmRemerge); setConfirmRemerge(null); }}
          onCancel={() => setConfirmRemerge(null)}
        />
      )}
    </div>
  );
}

// ─── Full-Page Sheet Viewer Component ───────────────────────────────────────
function SheetViewer({ sheet, onClose, mergeSelectedRowsToDatabase, updateDataSheetRows, toast }) {
  // Safe fallback for columns — handles both 'columns' and 'headers' keys,
  // plus fallback to deriving from first row data
  const cols = useMemo(() => {
    // Try columns first (old local storage), then headers (Supabase), then derive from data
    const candidates = sheet.columns || sheet.headers;
    if (Array.isArray(candidates) && candidates.length > 0) return candidates;
    // Derive from first row if headers/columns missing or empty
    if (sheet.rows && sheet.rows.length > 0) {
      return Object.keys(sheet.rows[0]).filter(k => k !== '_idx' && k !== 'id' && k !== 'user_id');
    }
    return [];
  }, [sheet]);

  const rows = sheet.rows || [];

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => loadPageSize('lm_dc_viewer_page_size', 50));
  const [selected, setSelected] = useState(new Set()); // Set of row indices
  const [selectAllRows, setSelectAllRows] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmDeleteRows, setConfirmDeleteRows] = useState(false);
  const [importTarget, setImportTarget] = useState(null); // 'publisher' | 'lead' | null

  // Filter rows by search
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows.map((r, i) => ({ ...r, _idx: i }));
    const q = search.toLowerCase();
    return rows
      .map((r, i) => ({ ...r, _idx: i }))
      .filter(r => cols.some(c => String(r[c] || '').toLowerCase().includes(q)));
  }, [rows, cols, search]);

  const effectivePageSize = pageSize === 'all' ? filteredRows.length || 1 : pageSize;
  const pageData = pageSize === 'all' ? filteredRows : filteredRows.slice((page - 1) * effectivePageSize, page * effectivePageSize);

  const toggleSelect = (idx) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(idx) ? n.delete(idx) : n.add(idx);
      return n;
    });
    setSelectAllRows(false);
  };

  const toggleAllPage = () => {
    if (selectAllRows || selected.size === pageData.length) {
      setSelected(new Set());
      setSelectAllRows(false);
    } else {
      setSelected(new Set(pageData.map(r => r._idx)));
      setSelectAllRows(false);
    }
  };

  const handleSelectAllFiltered = () => {
    setSelected(new Set(filteredRows.map(r => r._idx)));
    setSelectAllRows(true);
  };

  const handleClearSelection = () => {
    setSelected(new Set());
    setSelectAllRows(false);
  };

  const handleDeleteSelectedRows = () => {
    const indicesToDelete = new Set(selected);
    const newRows = rows.filter((_, i) => !indicesToDelete.has(i));
    updateDataSheetRows(sheet.id, newRows);
    toast('success', 'Rows Deleted', `${selected.size} rows removed from sheet.`);
    setSelected(new Set());
    setSelectAllRows(false);
    setConfirmDeleteRows(false);
  };

  const handleImportSelected = (targetType) => {
    const selectedIndices = [...selected];
    const res = mergeSelectedRowsToDatabase(sheet.id, selectedIndices, targetType);
    if (res.status === 'ok') {
      toast('success', 'Import Complete', `${res.added} records imported to ${targetType === 'publisher' ? 'Publishers' : 'CRM Leads'}. (${res.skipped} duplicates skipped)`);
    } else {
      toast('error', 'Import Failed', res.message || 'Error occurred during import.');
    }
    setImportTarget(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 2000 }}>
      <div
        className="animate-scale-in"
        onClick={e => e.stopPropagation()}
        style={{
          width: '95vw', maxWidth: 1400, height: '90vh',
          background: 'var(--color-bg-card)', borderRadius: 12,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, flexWrap: 'wrap', gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sheet size={18} style={{ color: sheet.targetType === 'publisher' ? 'var(--color-accent)' : '#7C3AED' }} />
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>{sheet.name}</h2>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'flex', gap: 10, marginTop: 2 }}>
                <span>{rows.length} total rows</span>
                <span>•</span>
                <span>{cols.length} columns</span>
                <span>•</span>
                <span style={{
                  fontWeight: 700,
                  color: sheet.targetType === 'publisher' ? '#B45309' : '#6D28D9'
                }}>
                  {sheet.targetType === 'publisher' ? 'Publisher DB' : 'CRM Leads'}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <input
                className="search-input"
                placeholder="Search rows..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); setSelected(new Set()); setSelectAllRows(false); }}
                style={{ fontSize: '0.8rem', padding: '5px 10px', width: 180 }}
              />
            </div>
            <button className="modal-close" onClick={onClose} style={{ position: 'static' }}><X size={18} /></button>
          </div>
        </div>

        {/* Selection Actions Bar */}
        {selected.size > 0 && (
          <div style={{
            padding: '8px 20px', background: 'linear-gradient(135deg, rgba(201,162,77,0.15) 0%, rgba(124,58,237,0.1) 100%)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            flexShrink: 0
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-text)' }}>
              {selected.size} of {filteredRows.length} rows selected
            </span>

            {/* Select All Filtered */}
            {selected.size === pageData.length && !selectAllRows && filteredRows.length > pageData.length && (
              <button className="btn btn-xs" onClick={handleSelectAllFiltered}
                style={{ background: 'var(--color-accent)', color: '#fff', border: 'none', fontSize: '0.72rem' }}>
                Select all {filteredRows.length} rows
              </button>
            )}

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button className="btn btn-xs btn-primary" onClick={() => setImportTarget('publisher')}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Database size={12} /> Import to Publishers
              </button>
              <button className="btn btn-xs" onClick={() => setImportTarget('lead')}
                style={{ background: '#7C3AED', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={12} /> Import to CRM
              </button>
              <button className="btn btn-xs" onClick={() => setConfirmDeleteRows(true)}
                style={{ background: 'rgba(239,68,68,0.8)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Trash2 size={12} /> Delete Rows
              </button>
              <button className="btn btn-xs btn-ghost" onClick={handleClearSelection}
                style={{ fontSize: '0.72rem' }}>
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          <table style={{ margin: 0, fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th style={{ width: 40, position: 'sticky', top: 0, background: 'var(--color-bg-hover)', zIndex: 2 }}>
                  <input type="checkbox" className="checkbox"
                    checked={pageData.length > 0 && (selectAllRows || selected.size === pageData.length)}
                    onChange={toggleAllPage} />
                </th>
                <th style={{ width: 40, position: 'sticky', top: 0, background: 'var(--color-bg-hover)', zIndex: 2, fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>#</th>
                {cols.map(col => (
                  <th key={col} style={{
                    position: 'sticky', top: 0, background: 'var(--color-bg-hover)', zIndex: 2,
                    whiteSpace: 'nowrap', fontSize: '0.74rem'
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr><td colSpan={cols.length + 2} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
                  {search ? 'No rows match your search.' : 'No data rows.'}
                </td></tr>
              ) : pageData.map((row) => (
                <tr key={row._idx}
                  className={selected.has(row._idx) ? 'selected' : ''}
                  onClick={() => toggleSelect(row._idx)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="cell-check" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" className="checkbox"
                      checked={selected.has(row._idx)}
                      onChange={() => toggleSelect(row._idx)} />
                  </td>
                  <td style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>{row._idx + 1}</td>
                  {cols.map(col => (
                    <td key={col} style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: 200 }}>
                      {row[col] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div style={{ flexShrink: 0 }}>
          <Pagination
            total={filteredRows.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            entityName="rows"
            pageSizeKey="lm_dc_viewer_page_size"
            pageSizeOptions={[25, 50, 100, 250]}
          />
        </div>
      </div>

      {/* Confirm Delete Rows */}
      {confirmDeleteRows && (
        <ConfirmModal
          title={`Delete ${selected.size} Rows?`}
          message="These rows will be removed from the sheet. This cannot be undone."
          confirmLabel="Delete Rows"
          onConfirm={handleDeleteSelectedRows}
          onCancel={() => setConfirmDeleteRows(false)}
        />
      )}

      {/* Confirm Import */}
      {importTarget && (
        <ConfirmModal
          title={`Import ${selected.size} Rows to ${importTarget === 'publisher' ? 'Publishers' : 'CRM Leads'}?`}
          message={`The selected ${selected.size} rows will be mapped and imported. Existing duplicates will be skipped.`}
          confirmLabel={`Import to ${importTarget === 'publisher' ? 'Publishers' : 'CRM'}`}
          onConfirm={() => handleImportSelected(importTarget)}
          onCancel={() => setImportTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Tiny Helper Spinner ───
function Spinner({ size }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size || 12,
        height: size || 12,
        border: '2px solid currentColor',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite'
      }}
    />
  );
}
