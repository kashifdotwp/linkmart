import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

export default function ConfirmModal({ title, message, confirmLabel = 'Delete', variant = 'danger', onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal modal-sm animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
          <div className={`confirm-icon-wrap confirm-icon-${variant}`}>
            {variant === 'danger' ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
          </div>
          <h3 style={{ marginBottom: 8 }}>{title}</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
            {message}
          </p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center', gap: 12 }}>
          <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
          <button
            id="confirm-action-btn"
            className={`btn btn-${variant}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
