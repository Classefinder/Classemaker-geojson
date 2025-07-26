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
    <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: 260 }}>
      <h3>Attributs</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {Object.entries(localProps).map(([key, value]) => (
          <li key={key} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
            <input value={key} disabled style={{ marginRight: 6, width: 80 }} />
            <input value={value} onChange={e => handleChange(key, e.target.value)} style={{ flex: 1, marginRight: 6 }} />
            <button onClick={() => handleRemove(key)}>🗑️</button>
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', marginTop: 8 }}>
        <input placeholder="Clé" value={newKey} onChange={e => setNewKey(e.target.value)} style={{ width: 80, marginRight: 4 }} />
        <input placeholder="Valeur" value={newValue} onChange={e => setNewValue(e.target.value)} style={{ flex: 1, marginRight: 4 }} />
        <button onClick={handleAdd}>➕</button>
      </div>
    </div>
  );
};

export default AttributeEditor;
