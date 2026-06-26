import React, { useState } from 'react';
import { Download, CheckSquare, Square, X } from 'lucide-react';
import { exportCSV } from '../../utils/helpers';

export default function ExportModal({ columns, data, filename, onClose }) {
  const [selected, setSelected] = useState(new Set(columns.map(c => c.key)));

  const toggle = (key) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(columns.map(c => c.key)));
  const deselectAll = () => setSelected(new Set());

  const handleExport = () => {
    const selectedCols = columns.filter(c => selected.has(c.key));
    if (selectedCols.length === 0) return;
    exportCSV(data, selectedCols, filename);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-md animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Export CSV</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: 3 }}>
              Select which columns to include in the export
            </p>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="flex gap-2" style={{ marginBottom: 14 }}>
            <button className="btn btn-sm btn-outline" onClick={selectAll} id="export-select-all">
              <CheckSquare size={14} /> Select All
            </button>
            <button className="btn btn-sm btn-outline" onClick={deselectAll} id="export-deselect-all">
              <Square size={14} /> Deselect All
            </button>
            <span className="text-muted text-sm" style={{ marginLeft: 'auto', alignSelf: 'center' }}>
              {selected.size} of {columns.length} selected
            </span>
          </div>

          <div className="export-columns-grid">
            {columns.map(col => (
              <div
                key={col.key}
                className={`export-col-item ${selected.has(col.key) ? 'checked' : ''}`}
                onClick={() => toggle(col.key)}
                id={`export-col-${col.key}`}
              >
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={selected.has(col.key)}
                  onChange={() => toggle(col.key)}
                  onClick={e => e.stopPropagation()}
                />
                {col.label}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={selected.size === 0}
            id="export-csv-btn"
          >
            <Download size={16} />
            Export CSV ({selected.size} cols)
          </button>
        </div>
      </div>
    </div>
  );
}
