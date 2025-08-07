import '../attribute-editor.css'; // Styles dédiés AttributeEditor
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
    //
    // .attr-panel : panneau principal
    // .attr-title : titre
    // .attr-list : liste des attributs
    // .attr-list-item : ligne attribut
    // .attr-key : input clé
    // .attr-value-row : ligne valeur + bouton
    // .attr-value : input valeur
    // .attr-remove-btn : bouton suppression
    // .attr-add-row : ligne ajout
    // .attr-add-key : input ajout clé
    // .attr-add-value : input ajout valeur
    // .attr-add-btn : bouton ajout
    //
    <div className="attr-panel">
      <h3 className="attr-title">Attributs</h3>
      <ul className="attr-list">
        {Object.entries(localProps).map(([key, value]) => (
          <li key={key} className="attr-list-item">
            <input value={key} disabled className="attr-key" />
            <div className="attr-value-row">
              <input value={value} onChange={e => handleChange(key, e.target.value)} className="attr-value" />
              <button onClick={() => handleRemove(key)} className="btn btn-danger">🗑️</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="attr-add-row">
        <input placeholder="Clé" value={newKey} onChange={e => setNewKey(e.target.value)} className="attr-add-key" />
        <input placeholder="Valeur" value={newValue} onChange={e => setNewValue(e.target.value)} className="attr-add-value" />
        <button onClick={handleAdd} className="btn btn-primary">➕</button>
      </div>
    </div>
  );
};

export default AttributeEditor;
