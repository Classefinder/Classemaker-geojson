import React from 'react';

export interface LayerInfo {
  id: string;
  name: string;
  visible: boolean;
}

interface LayerManagerProps {
  layers: LayerInfo[];
  activeLayerId: string | null;
  onAddLayer: () => void;
  onRemoveLayer: (id: string) => void;
  onRenameLayer: (id: string, name: string) => void;
  onToggleLayer: (id: string) => void;
  onSelectLayer: (id: string) => void;
}

const LayerManager: React.FC<LayerManagerProps> = ({
  layers,
  activeLayerId,
  onAddLayer,
  onRemoveLayer,
  onRenameLayer,
  onToggleLayer,
  onSelectLayer,
}) => {
  return (
    <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: 260 }}>
      <h3>Calques</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {layers.map(layer => (
          <li key={layer.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', background: activeLayerId === layer.id ? '#e3f2fd' : 'transparent', borderRadius: 4 }}>
            <input type="checkbox" checked={layer.visible} onChange={() => onToggleLayer(layer.id)} style={{ marginRight: 6 }} />
            <span onClick={() => onSelectLayer(layer.id)} style={{ flex: 1, cursor: 'pointer', fontWeight: activeLayerId === layer.id ? 'bold' : 'normal' }}>{layer.name}</span>
            <button onClick={() => {
              const newName = prompt('Nouveau nom du calque', layer.name);
              if (newName) onRenameLayer(layer.id, newName);
            }}>✏️</button>
            <button onClick={() => onRemoveLayer(layer.id)} style={{ marginLeft: 4 }}>🗑️</button>
          </li>
        ))}
      </ul>
      <button onClick={onAddLayer} style={{ width: '100%', marginTop: 8 }}>➕ Ajouter un calque</button>
    </div>
  );
};

export default LayerManager;
