import React, { useState } from 'react';

interface AttributeEditorProps {
  properties: Record<string, any>;
  onChange: (props: Record<string, any>) => void;
}

const AttributeEditor: React.FC<AttributeEditorProps> = ({ properties, onChange }) => {
  const [localProps, setLocalProps] = useState<Record<string, any>>(properties);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleChange = (key: string, value: string) => {
    const updated = { ...localProps, [key]: value };
    setLocalProps(updated);
    onChange(updated);
  };

  const handleAdd = () => {
    if (newKey) {
      const updated = { ...localProps, [newKey]: newValue };
      setLocalProps(updated);
      onChange(updated);
      setNewKey('');
      setNewValue('');
    }
  };

  const handleRemove = (key: string) => {
    const updated = { ...localProps };
    delete updated[key];
    setLocalProps(updated);
    onChange(updated);
  };

  return (
    <div style={{ background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.13)', width: 300, maxWidth: '90vw', maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: 18, wordBreak: 'break-word' }}>Attributs</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {Object.entries(localProps).map(([key, value]) => (
          <li key={key} style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
            <input value={key} disabled style={{ width: '100%', background: '#f0f0f0', marginBottom: 2, wordBreak: 'break-all' }} />
            <div style={{ display: 'flex', gap: 4 }}>
              <input value={value} onChange={e => handleChange(key, e.target.value)} style={{ flex: 1, minWidth: 0, wordBreak: 'break-all' }} />
              <button onClick={() => handleRemove(key)} style={{ minWidth: 32, padding: '0.3em 0.6em', flexShrink: 0 }}>🗑️</button>
            </div>
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
        <input placeholder="Clé" value={newKey} onChange={e => setNewKey(e.target.value)} style={{ width: 80, marginRight: 4, flexShrink: 0 }} />
        <input placeholder="Valeur" value={newValue} onChange={e => setNewValue(e.target.value)} style={{ flex: 1, marginRight: 4, minWidth: 0 }} />
        <button onClick={handleAdd} style={{ minWidth: 32, padding: '0.3em 0.6em', flexShrink: 0 }}>➕</button>
      </div>
    </div>
  );
};

export default AttributeEditor;
