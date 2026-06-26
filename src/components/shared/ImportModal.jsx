import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, X, Check, ChevronRight, AlertCircle } from 'lucide-react';

export default function ImportModal({ systemFields, onImport, onClose, entityName = 'records' }) {
  const [step, setStep] = useState(1); // 1=upload, 2=mapping, 3=preview
  const [csvData, setCsvData] = useState(null);   // { headers, rows }
  const [mapping, setMapping] = useState({});       // systemField.key -> csvHeader
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleFile = (file) => {
    setError('');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data.length) { setError('CSV file is empty.'); return; }
        const headers = Object.keys(results.data[0]);
        setCsvData({ headers, rows: results.data });
        // Auto-map where header matches field label or key
        const autoMap = {};
        systemFields.forEach(f => {
          const match = headers.find(h =>
            h.toLowerCase() === f.label.toLowerCase() ||
            h.toLowerCase() === f.key.toLowerCase()
          );
          if (match) autoMap[f.key] = match;
        });
        setMapping(autoMap);
        setStep(2);
      },
      error: () => setError('Failed to parse CSV. Make sure it is a valid CSV file.'),
    });
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) handleFile(file);
    else setError('Please drop a .csv file.');
  };

  const mappedCount = Object.keys(mapping).filter(k => mapping[k]).length;

  const handleImport = () => {
    const mapped = csvData.rows.map(row => {
      const record = {};
      systemFields.forEach(f => {
        if (mapping[f.key]) record[f.key] = row[mapping[f.key]] || '';
      });
      return record;
    });
    onImport(mapped);
    onClose();
  };

  const previewRows = csvData?.rows.slice(0, 5) || [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-xl animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Import CSV</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: 3 }}>
              Import {entityName} from a CSV file
            </p>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {/* Steps */}
          <div className="import-steps">
            {['Upload File', 'Map Columns', 'Preview & Import'].map((label, i) => {
              const stepNum = i + 1;
              const done = step > stepNum;
              const active = step === stepNum;
              return (
                <React.Fragment key={label}>
                  {i > 0 && <div className="import-step-line" />}
                  <div className={`import-step ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
                    <div className="import-step-num">
                      {done ? <Check size={11} /> : stepNum}
                    </div>
                    {label}
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Step 1: Upload */}
          {step === 1 && (
            <div>
              <div
                className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="drop-zone-icon" size={40} />
                <h3 style={{ marginBottom: 6 }}>Drop your CSV file here</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  or click to browse files
                </p>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', marginTop: 8 }}>
                  Supports .csv files only
                </p>
              </div>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, color: 'var(--color-danger-text)', fontSize: '0.85rem' }}>
                  <AlertCircle size={15} /> {error}
                </div>
              )}
              <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
                onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
            </div>
          )}

          {/* Step 2: Mapping */}
          {step === 2 && csvData && (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 14 }}>
                Match your CSV columns to system fields. <strong>{mappedCount}</strong> of {systemFields.length} fields mapped.
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table className="mapping-table">
                  <thead>
                    <tr>
                      <th>System Field</th>
                      <th>Your CSV Column</th>
                      <th>Sample Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemFields.map(field => {
                      const sample = mapping[field.key] && csvData.rows[0]
                        ? csvData.rows[0][mapping[field.key]] : '';
                      return (
                        <tr key={field.key}>
                          <td>
                            <span style={{ fontWeight: 500 }}>{field.label}</span>
                            {field.required && <span style={{ color: 'var(--color-danger)', marginLeft: 3 }}>*</span>}
                          </td>
                          <td>
                            <select
                              className="form-select"
                              style={{ padding: '5px 8px', fontSize: '0.82rem' }}
                              value={mapping[field.key] || ''}
                              onChange={e => setMapping(m => ({ ...m, [field.key]: e.target.value || undefined }))}
                              id={`map-field-${field.key}`}
                            >
                              <option value="">— Skip —</option>
                              {csvData.headers.map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            {sample ? <span className="preview-badge">{String(sample).slice(0, 40)}</span> : <span className="text-muted" style={{ fontSize: '0.78rem' }}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 14 }}>
                Preview of first {previewRows.length} rows to import ({csvData.rows.length} total):
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table className="mapping-table">
                  <thead>
                    <tr>
                      {systemFields.filter(f => mapping[f.key]).map(f => (
                        <th key={f.key}>{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i}>
                        {systemFields.filter(f => mapping[f.key]).map(f => (
                          <td key={f.key} style={{ fontSize: '0.8rem', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {row[mapping[f.key]] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          {step === 2 && (
            <button className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
          )}
          {step === 3 && (
            <button className="btn btn-outline" onClick={() => setStep(2)}>Back</button>
          )}
          {step === 2 && (
            <button className="btn btn-primary" onClick={() => setStep(3)} id="import-next-btn">
              <ChevronRight size={16} />
              Preview ({csvData?.rows.length} rows)
            </button>
          )}
          {step === 3 && (
            <button className="btn btn-primary" onClick={handleImport} id="import-confirm-btn">
              <Upload size={16} />
              Import {csvData?.rows.length} {entityName}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
