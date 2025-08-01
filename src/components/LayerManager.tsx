import React, { useState } from 'react';
import ItineraryExportModal from './ItineraryExportModal';
import type { LayerData } from '../App';

export type LayerCategory = 'salles' | 'chemin' | 'fond';
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
    // Récupère tous les features des calques 'chemin'
    const cheminLayers = layers.filter(layer => layer.info.category === 'chemin');
    let nodeId = -1;
    let wayId = -1;
    const nodes: { id: number; lat: number; lon: number; tags?: Record<string, string|number> }[] = [];
    const ways: { id: number; nodeRefs: number[]; tags: Record<string, string|number> }[] = [];
    const nodeMap = new Map<string, number>(); // key: 'lat,lon' => nodeId

    cheminLayers.forEach((layer, layerIdx) => {
      const userNumber = layerAttributes[layer.info.id];
      (layer.data.features || []).forEach(feature => {
        if (feature.geometry.type === 'LineString') {
          const coords = feature.geometry.coordinates as [number, number][];
          const nodeRefs: number[] = [];
          coords.forEach(([lon, lat]) => {
            const key = `${lat},${lon}`;
            let id;
            if (nodeMap.has(key)) {
              id = nodeMap.get(key)!;
            } else {
              id = nodeId--;
              nodeMap.set(key, id);
              nodes.push({ id, lat, lon });
            }
            nodeRefs.push(id);
          });
          // Ajoute le way avec les tags demandés
          ways.push({
            id: wayId--,
            nodeRefs,
            tags: {
              bridge: 'yes',
              layer: layerIdx, // index du calque
              foot: 'yes',
              name: userNumber,
            }
          });
        }
      });
    });

    // Génère le XML OSM
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<osm version="0.6" generator="ClassefinderGeoJSONMaker">\n`;
    nodes.forEach(node => {
      xml += `<node id=\"${node.id}\" lat=\"${node.lat}\" lon=\"${node.lon}\" />\n`;
    });
    ways.forEach(way => {
      xml += `<way id=\"${way.id}\">\n`;
      way.nodeRefs.forEach(ref => {
        xml += `  <nd ref=\"${ref}\" />\n`;
      });
      Object.entries(way.tags).forEach(([k, v]) => {
        xml += `  <tag k=\"${k}\" v=\"${v}\" />\n`;
      });
      xml += `</way>\n`;
    });
    xml += `</osm>`;

    const blob = new Blob([xml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'itinerary.osm';
    a.click();
    URL.revokeObjectURL(url);
  };

  const categories: LayerCategory[] = ['salles', 'chemin', 'fond'];
  return (
    <div style={{ background: '#fff', padding: 8, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: 220, fontSize: 14 }}>
      <h3 style={{ margin: '8px 0 4px 0', fontSize: 16 }}>Calques</h3>
      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 'bold', color: '#1976d2', marginBottom: 2 }}>
            {cat === 'salles' ? 'Salles' : cat === 'chemin' ? 'Chemins' : 'Fond de carte'}
          </div>
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
          <button onClick={() => onAddLayer(cat)} style={{ width: '100%', marginTop: 2, fontSize: 13 }}>➕ Ajouter {cat === 'salles' ? 'salle' : cat === 'chemin' ? 'chemin' : 'fond'}</button>
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
