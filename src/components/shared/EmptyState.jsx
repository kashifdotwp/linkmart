import React from 'react';
import { Search, Plus } from 'lucide-react';

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {Icon ? <Icon size={52} /> : <Search size={52} />}
      </div>
      <h3 className="empty-state-title">{title || 'No results found'}</h3>
      <p className="empty-state-desc">{description || 'Try adjusting your search or filters.'}</p>
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction} id="empty-state-action">
          <Plus size={16} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
