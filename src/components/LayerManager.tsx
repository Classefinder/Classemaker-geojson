import React, { useState } from 'react';
import ItineraryExportModal from './ItineraryExportModal';
import type { LayerData } from '../App';

export type LayerCategory = 'salles' | 'chemin';
export interface LayerInfo {
  id: string;
  name: string;
  visible: boolean;
  category: LayerCategory;
  features: Array<{ type: string; properties: Record<string, any>; geometry: any }>;
}

interface LayerManagerProps {
  layers: LayerData[];
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
  const [showExportModal, setShowExportModal] = useState(false);

  const handleExportItinerary = (layerAttributes: Record<string, number>) => {
    const features = layers
      .filter(layer => layer.info.category === 'chemin')
      .flatMap(layer =>
        (layer.data.features || []).map(feature => ({
          ...feature,
          properties: {
            ...feature.properties,
            foot: 'yes',
            etage: layerAttributes[layer.info.id],
          },
        }))
      );
    const combinedGeoJson = {
      type: 'FeatureCollection',
      features,
    };
    const blob = new Blob([JSON.stringify(combinedGeoJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'itinerary.geojson';
    a.click();
    URL.revokeObjectURL(url);
  };

  const categories: LayerCategory[] = ['salles', 'chemin'];
  return (
    <div style={{ background: '#fff', padding: 8, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: 220, fontSize: 14 }}>
      <h3 style={{ margin: '8px 0 4px 0', fontSize: 16 }}>Calques</h3>
      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 'bold', color: '#1976d2', marginBottom: 2 }}>{cat === 'salles' ? 'Salles' : 'Chemins'}</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {layers.filter(l => l.info.category === cat).map(layer => (
              <li key={layer.info.id} style={{ marginBottom: 4, display: 'flex', alignItems: 'center', background: activeLayerId === layer.info.id ? '#e3f2fd' : 'transparent', borderRadius: 4 }}>
                <input type="checkbox" checked={layer.info.visible} onChange={() => onToggleLayer(layer.info.id)} style={{ marginRight: 6 }} />
                <span onClick={() => onSelectLayer(layer.info.id)} style={{ flex: 1, cursor: 'pointer', fontWeight: activeLayerId === layer.info.id ? 'bold' : 'normal' }}>{layer.info.name}</span>
                <button onClick={() => {
                  const newName = prompt('Nouveau nom du calque', layer.info.name);
                  if (newName) onRenameLayer(layer.info.id, newName);
                }} style={{ marginLeft: 2 }}>✏️</button>
                <button onClick={() => onRemoveLayer(layer.info.id)} style={{ marginLeft: 2 }}>🗑️</button>
              </li>
            ))}
          </ul>
          <button onClick={() => onAddLayer(cat)} style={{ width: '100%', marginTop: 2, fontSize: 13 }}>➕ Ajouter {cat === 'salles' ? 'salle' : 'chemin'}</button>
          {cat === 'chemin' && (
            <button onClick={() => setShowExportModal(true)} style={{ width: '100%', marginTop: 2, fontSize: 13, backgroundColor: '#4caf50', color: '#fff' }}>
              📤 Export Itinéraire
            </button>
          )}
        </div>
      ))}
      {showExportModal && (
        <ItineraryExportModal
          layers={layers.filter(layer => layer.info.category === 'chemin').map(l => l.info)}
          onClose={() => setShowExportModal(false)}
          onExport={handleExportItinerary}
        />
      )}
    </div>
  );
};

export default LayerManager;
