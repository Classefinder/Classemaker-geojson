import React from 'react';

export type LayerCategory = 'salles' | 'chemin';
export interface LayerInfo {
  id: string;
  name: string;
  visible: boolean;
  category: LayerCategory;
}

interface LayerManagerProps {
  layers: LayerInfo[];
  activeLayerId: string | null;
  onAddLayer: (category: LayerCategory) => void;
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
  const categories: LayerCategory[] = ['salles', 'chemin'];
  return (
    <div style={{ background: '#fff', padding: 8, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: 220, fontSize: 14 }}>
      <h3 style={{ margin: '8px 0 4px 0', fontSize: 16 }}>Calques</h3>
      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 'bold', color: '#1976d2', marginBottom: 2 }}>{cat === 'salles' ? 'Salles' : 'Chemins'}</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {layers.filter(l => l.category === cat).map(layer => (
              <li key={layer.id} style={{ marginBottom: 4, display: 'flex', alignItems: 'center', background: activeLayerId === layer.id ? '#e3f2fd' : 'transparent', borderRadius: 4 }}>
                <input type="checkbox" checked={layer.visible} onChange={() => onToggleLayer(layer.id)} style={{ marginRight: 6 }} />
                <span onClick={() => onSelectLayer(layer.id)} style={{ flex: 1, cursor: 'pointer', fontWeight: activeLayerId === layer.id ? 'bold' : 'normal' }}>{layer.name}</span>
                <button onClick={() => {
                  const newName = prompt('Nouveau nom du calque', layer.name);
                  if (newName) onRenameLayer(layer.id, newName);
                }} style={{ marginLeft: 2 }}>✏️</button>
                <button onClick={() => onRemoveLayer(layer.id)} style={{ marginLeft: 2 }}>🗑️</button>
              </li>
            ))}
          </ul>
          <button onClick={() => onAddLayer(cat)} style={{ width: '100%', marginTop: 2, fontSize: 13 }}>➕ Ajouter {cat === 'salles' ? 'salle' : 'chemin'}</button>
        </div>
      ))}
    </div>
  );
};

export default LayerManager;
