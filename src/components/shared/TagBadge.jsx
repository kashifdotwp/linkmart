import React from 'react';
import { getTagColor } from '../../utils/configStore';

// Renders a single tag as a colored pill
export default function TagBadge({ tag, size = 'sm', onRemove }) {
  if (!tag) return null;
  const col = getTagColor(tag.color);
  const fontSize = size === 'xs' ? '0.68rem' : size === 'sm' ? '0.73rem' : '0.8rem';
  const padding = size === 'xs' ? '1px 6px' : size === 'sm' ? '2px 8px' : '3px 10px';

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: col.bg, color: col.text, border: `1px solid ${col.border}`,
      borderRadius: 999, padding, fontSize, fontWeight: 600,
      whiteSpace: 'nowrap', lineHeight: 1.4,
    }}>
      {tag.label}
      {onRemove && (
        <button type="button" onClick={onRemove} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'inherit', padding: 0, fontSize: '0.9em', lineHeight: 1,
        }}>×</button>
      )}
    </span>
  );
}

// Renders a list of tags with +N overflow
export function TagList({ tagIds = [], allTags = [], maxVisible = 3 }) {
  const tags = tagIds.map(id => allTags.find(t => t.id === id)).filter(Boolean);
  const visible = tags.slice(0, maxVisible);
  const rest = tags.length - maxVisible;

  if (tags.length === 0) return <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>—</span>;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
      {visible.map(tag => <TagBadge key={tag.id} tag={tag} size="xs" />)}
      {rest > 0 && (
        <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>+{rest}</span>
      )}
    </div>
  );
}
