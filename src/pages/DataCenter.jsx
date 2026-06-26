import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import {
  Layers, Upload, X, Check, Database, Users, Eye, Trash2, ArrowUpRight,
  Sheet, AlertCircle, FileSpreadsheet, Calendar, Link, HardDriveDownload
} from 'lucide-react';
import { useApp } from '../context/AppContext';

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
  const { dataSheets, addDataSheet, deleteDataSheet, mergeDataSheetToDatabase, toast } = useApp();

  // Modals / Dialogs states
  const [showUpload, setShowUpload] = useState(false);
  const [previewSheet, setPreviewSheet] = useState(null); // sheet object to preview
  const [mergingId, setMergingId] = useState(null);

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
      columns: rawHeaders,
      mappings: mappings,
      rows: rawRows,
    });

    toast('success', 'Sheet Added', `"${sheetName}" added to Data Center.`);
    setShowUpload(false);
    resetWizard();
  };

  const handleMergeSheet = async (sheet) => {
    setMergingId(sheet.id);
    // Timeout to allow UI animation
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

      {/* Sheets Grid */}
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
        <div className="charts-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 16 }}>
          {dataSheets.map(sheet => (
            <div key={sheet.id} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: sheet.targetType === 'publisher' ? 'rgba(201,162,77,0.12)' : 'rgba(124,58,237,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Sheet size={20} style={{ color: sheet.targetType === 'publisher' ? 'var(--color-accent)' : '#7C3AED' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sheet.name}>
                    {sheet.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 800, padding: '1px 6px', borderRadius: 4,
                      background: sheet.targetType === 'publisher' ? '#FEF3C7' : '#F3E8FF',
                      color: sheet.targetType === 'publisher' ? '#B45309' : '#6D28D9'
                    }}>
                      {sheet.targetType === 'publisher' ? 'Publisher DB' : 'CRM Leads'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>via {sheet.source}</span>
                  </div>
                </div>
              </div>

              {/* Specs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '8px 10px', background: 'var(--color-bg-hover)', borderRadius: 8, fontSize: '0.78rem', marginBottom: 14 }}>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Records:</span>
                  <strong style={{ marginLeft: 4, color: 'var(--color-text)' }}>{sheet.rowCount} rows</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Status:</span>
                  <span style={{
                    marginLeft: 4, fontWeight: 700,
                    color: sheet.status === 'Imported' ? 'var(--color-accent-hover)' : 'var(--color-success-text)'
                  }}>
                    {sheet.status}
                  </span>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Uploaded:</span>
                  <strong style={{ marginLeft: 4, color: 'var(--color-text)' }}>{new Date(sheet.uploadedAt).toLocaleDateString()}</strong>
                </div>
              </div>

              {/* Footer Actions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                <button className="btn btn-outline btn-xs flex-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }} onClick={() => setPreviewSheet(sheet)}>
                  <Eye size={12} /> View Raw
                </button>
                <button
                  className="btn btn-primary btn-xs flex-1"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    background: sheet.status !== 'Imported' ? 'var(--color-bg-hover)' : '',
                    color: sheet.status !== 'Imported' ? 'var(--color-text-muted)' : '',
                    border: sheet.status !== 'Imported' ? '1px solid var(--color-border)' : ''
                  }}
                  disabled={sheet.status !== 'Imported' || mergingId === sheet.id}
                  onClick={() => handleMergeSheet(sheet)}
                >
                  {mergingId === sheet.id ? (
                    <Loader2 className="animate-spin" size={12} />
                  ) : (
                    <HardDriveDownload size={12} />
                  )}
                  {sheet.status === 'Imported' ? 'Merge DB' : 'Merged'}
                </button>
                <button
                  className="btn btn-outline btn-xs"
                  style={{ color: 'var(--color-danger-text)' }}
                  onClick={() => {
                    if (confirm(`Remove sheet "${sheet.name}"?`)) deleteDataSheet(sheet.id);
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
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

      {/* ─── MODAL: SHEET PREVIEW ─── */}
      {previewSheet && (
        <div className="modal-backdrop" onClick={() => setPreviewSheet(null)}>
          <div className="modal modal-xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Raw Data Preview: {previewSheet.name}</h2>
              <button className="modal-close" onClick={() => setPreviewSheet(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              <div style={{ padding: '10px 16px', background: 'var(--color-bg-hover)', fontSize: '0.78rem', borderBottom: '1px solid var(--color-border)' }}>
                Showing first 50 rows of {previewSheet.rowCount} total records. Mapped database type: <strong>{previewSheet.targetType === 'publisher' ? 'Publisher Database' : 'CRM Leads'}</strong>
              </div>
              <div className="table-container" style={{ maxHeight: 400, overflowY: 'auto' }}>
                <table style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      {previewSheet.columns.map(col => (
                        <th key={col} style={{ background: 'var(--color-bg-hover)', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewSheet.rows.slice(0, 50).map((row, idx) => (
                      <tr key={idx}>
                        {previewSheet.columns.map(col => (
                          <td key={col} style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: 180 }}>
                            {row[col] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setPreviewSheet(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tiny Helper Spinner ───
function Loader2({ className, size }) {
  return (
    <span
      className={className}
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
