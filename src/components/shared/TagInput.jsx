import React, { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { getTagColor } from '../../utils/configStore';
import { useApp } from '../../context/AppContext';

// TagInput: shows selected tags as pills + lets user search/add from existing tags or create new
export default function TagInput({ value = [], onChange }) {
  const { config } = useApp();
  const [inputVal, setInputVal] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  const allTags = config.tags || [];

  // Filter tags not already selected, matching input
  const filtered = allTags.filter(t =>
    !value.includes(t.id) &&
    t.label.toLowerCase().includes(inputVal.toLowerCase())
  );

  const addTag = (tagId) => {
    onChange([...value, tagId]);
    setInputVal('');
    inputRef.current?.focus();
  };

  const removeTag = (tagId) => onChange(value.filter(id => id !== tagId));

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && !inputVal && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
    if (e.key === 'Escape') setShowDropdown(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div
        className="tag-input-wrap"
        onClick={() => { inputRef.current?.focus(); setShowDropdown(true); }}
      >
        {value.map(tagId => {
          const tag = allTags.find(t => t.id === tagId);
          if (!tag) return null;
          const col = getTagColor(tag.color);
          return (
            <span key={tagId} className="tag-pill" style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>
              {tag.label}
              <button type="button" onClick={(e) => { e.stopPropagation(); removeTag(tagId); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 4px', color: 'inherit', fontSize: '0.9em', lineHeight: 1 }}>
                ×
              </button>
            </span>
          );
        })}
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={e => { setInputVal(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? 'Add tags...' : ''}
          className="tag-input-field"
          id="tag-input-field"
        />
      </div>

      {showDropdown && (filtered.length > 0 || inputVal) && (
        <div className="tag-dropdown">
          {filtered.length === 0 && inputVal && (
            <div style={{ padding: '8px 12px', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              No matching tags. Go to <strong>Config Panel</strong> to create new tags.
            </div>
          )}
          {filtered.map(tag => {
            const col = getTagColor(tag.color);
            return (
              <button key={tag.id} type="button" className="tag-dropdown-item" onClick={() => addTag(tag.id)}>
                <span className="tag-pill" style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}`, fontSize: '0.75rem' }}>
                  {tag.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
