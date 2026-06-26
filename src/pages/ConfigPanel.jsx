import React, { useState } from 'react';
import {
  Sliders, Plus, Trash2, Edit, Check, X, GripVertical,
  Link2, Tag, Globe, Activity, Layers, BookOpen, List,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEFAULT_CONFIG, TAG_COLORS, getTagColor } from '../utils/configStore';
import { generateId } from '../utils/helpers';

const CONFIG_TABS = [
  { key: 'linkTypes',         label: 'Link Types',         icon: Link2,    desc: 'Types of links you sell (Guest Post, Niche Edit, UGC…)' },
  { key: 'niches',            label: 'Niches',             icon: BookOpen, desc: 'Website niches/topics for publishers and leads' },
  { key: 'publisherStatuses', label: 'Publisher Statuses', icon: Activity, desc: 'Status labels for publisher records' },
  { key: 'leadStatuses',      label: 'Lead Statuses',      icon: Activity, desc: 'Status labels for CRM lead records' },
  { key: 'workLogStatuses',   label: 'Work Log Statuses',  icon: Layers,   desc: 'Delivery tracking stages (Won, Invoiced, Paid…)' },
  { key: 'linkAttributes',    label: 'Link Attributes',    icon: Globe,    desc: 'Link follow attributes (Dofollow, Nofollow, Sponsored, UGC)' },
  { key: 'countries',         label: 'Countries',          icon: Globe,    desc: 'Countries used in publisher and lead tabs' },
  { key: 'tags',              label: 'Tags',               icon: Tag,      desc: 'Custom tags applied to publishers and leads' },
];

// ── Simple string list editor ──
function StringListEditor({ values, onChange }) {
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [newVal, setNewVal] = useState('');

  const startEdit = (i) => { setEditIdx(i); setEditVal(values[i]); };
  const saveEdit = () => {
    if (!editVal.trim()) return;
    onChange(values.map((v, i) => i === editIdx ? editVal.trim() : v));
    setEditIdx(null);
  };
  const deleteItem = (i) => onChange(values.filter((_, idx) => idx !== i));
  const addItem = () => {
    if (!newVal.trim()) return;
    onChange([...values, newVal.trim()]);
    setNewVal('');
  };
  const moveUp = (i) => { if (i === 0) return; const arr = [...values]; [arr[i-1], arr[i]] = [arr[i], arr[i-1]]; onChange(arr); };
  const moveDown = (i) => { if (i === values.length - 1) return; const arr = [...values]; [arr[i], arr[i+1]] = [arr[i+1], arr[i]]; onChange(arr); };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        {values.map((v, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', background: 'var(--color-bg-card)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <button onClick={() => moveUp(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0, lineHeight: 1 }}>▲</button>
              <button onClick={() => moveDown(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0, lineHeight: 1 }}>▼</button>
            </div>
            {editIdx === i ? (
              <>
                <input autoFocus className="form-input" style={{ flex: 1, padding: '4px 8px', fontSize: '0.85rem' }}
                  value={editVal} onChange={e => setEditVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditIdx(null); }} />
                <button className="btn btn-primary btn-sm" onClick={saveEdit}><Check size={13} /></button>
                <button className="btn btn-outline btn-sm" onClick={() => setEditIdx(null)}><X size={13} /></button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 500 }}>{v}</span>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => startEdit(i)} title="Rename"><Edit size={13} /></button>
                <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => deleteItem(i)} title="Delete"><Trash2 size={13} /></button>
              </>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="form-input" style={{ flex: 1 }} placeholder="Add new item…"
          value={newVal} onChange={e => setNewVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()} id="config-new-item" />
        <button className="btn btn-primary btn-sm" onClick={addItem} id="config-add-item"><Plus size={14} /> Add</button>
      </div>
    </div>
  );
}

// ── Tag list editor (with color picker) ──
function TagListEditor({ tags, onChange }) {
  const [editId, setEditId] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [editColor, setEditColor] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('teal');

  const startEdit = (tag) => { setEditId(tag.id); setEditLabel(tag.label); setEditColor(tag.color); };
  const saveEdit = () => {
    onChange(tags.map(t => t.id === editId ? { ...t, label: editLabel.trim(), color: editColor } : t));
    setEditId(null);
  };
  const deleteTag = (id) => onChange(tags.filter(t => t.id !== id));
  const addTag = () => {
    if (!newLabel.trim()) return;
    onChange([...tags, { id: `tag-${Date.now().toString(36)}`, label: newLabel.trim(), color: newColor }]);
    setNewLabel('');
  };

  const ColorPicker = ({ selected, onSelect }) => (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
      {TAG_COLORS.map(c => (
        <button key={c.id} type="button" title={c.id}
          onClick={() => onSelect(c.id)}
          style={{ width: 22, height: 22, borderRadius: 6, background: c.bg, border: `2px solid ${selected === c.id ? c.text : c.border}`, cursor: 'pointer', transition: 'all 0.1s' }} />
      ))}
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        {tags.map(tag => {
          const col = getTagColor(tag.color);
          return (
            <div key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', background: 'var(--color-bg-card)' }}>
              {editId === tag.id ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input autoFocus className="form-input" style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                    value={editLabel} onChange={e => setEditLabel(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveEdit()} />
                  <ColorPicker selected={editColor} onSelect={setEditColor} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-primary btn-sm" onClick={saveEdit}><Check size={13} /> Save</button>
                    <button className="btn btn-outline btn-sm" onClick={() => setEditId(null)}><X size={13} /> Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 999, background: col.bg, color: col.text, border: `1px solid ${col.border}`, fontSize: '0.78rem', fontWeight: 700 }}>
                    {tag.label}
                  </span>
                  <span style={{ flex: 1 }} />
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => startEdit(tag)}><Edit size={13} /></button>
                  <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => deleteTag(tag.id)}><Trash2 size={13} /></button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Add new tag */}
      <div style={{ background: 'var(--color-bg-hover)', borderRadius: 10, padding: 14, border: '1.5px dashed var(--color-border)' }}>
        <div style={{ fontWeight: 600, fontSize: '0.78rem', marginBottom: 8, color: 'var(--color-text-secondary)' }}>ADD NEW TAG</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input className="form-input" style={{ flex: 1 }} placeholder="Tag name (e.g. UGC, Sponsored, Fast Delivery)"
            value={newLabel} onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTag()} id="config-tag-name" />
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 6 }}>Pick a color:</div>
          <ColorPicker selected={newColor} onSelect={setNewColor} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-primary btn-sm" onClick={addTag} id="config-add-tag"><Plus size={14} /> Add Tag</button>
          {newLabel && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Preview: <span style={{
                padding: '2px 8px', borderRadius: 999, fontSize: '0.73rem', fontWeight: 700,
                background: getTagColor(newColor).bg, color: getTagColor(newColor).text, border: `1px solid ${getTagColor(newColor).border}`
              }}>{newLabel}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Config Panel Page ──
export default function ConfigPanel() {
  const { config, updateConfigKey, toast } = useApp();
  const [activeTab, setActiveTab] = useState('linkTypes');

  const activeTabDef = CONFIG_TABS.find(t => t.key === activeTab);

  const handleChange = (key, values) => {
    updateConfigKey(key, values);
    toast('success', 'Saved', `${activeTabDef?.label} updated.`);
  };

  const resetToDefault = (key) => {
    updateConfigKey(key, DEFAULT_CONFIG[key]);
    toast('info', 'Reset', `${activeTabDef?.label} reset to defaults.`);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sliders size={17} style={{ color: '#7C3AED' }} />
            </span>
            Config Panel
          </h1>
          <p className="page-subtitle">Control all dropdown values, tags, and statuses used across the app — no code needed</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Sidebar Tabs */}
        <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '8px 0', boxShadow: 'var(--shadow-sm)' }}>
          {CONFIG_TABS.map(({ key, label, icon: Icon }) => (
            <button key={key}
              onClick={() => setActiveTab(key)}
              id={`config-tab-${key}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 16px', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: activeTab === key ? 'var(--color-accent-light)' : 'transparent',
                color: activeTab === key ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                borderLeft: activeTab === key ? '3px solid var(--color-accent)' : '3px solid transparent',
                fontWeight: activeTab === key ? 700 : 500, fontSize: '0.85rem',
                transition: 'all 0.15s',
              }}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Editor Panel */}
        <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{activeTabDef?.label}</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>{activeTabDef?.desc}</p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => resetToDefault(activeTab)} id="config-reset-btn">
              Reset to Defaults
            </button>
          </div>

          {activeTab === 'tags' ? (
            <TagListEditor
              tags={config.tags || []}
              onChange={(val) => handleChange('tags', val)}
            />
          ) : (
            <StringListEditor
              values={config[activeTab] || DEFAULT_CONFIG[activeTab] || []}
              onChange={(val) => handleChange(activeTab, val)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
