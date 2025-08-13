import '../layer-manager.css'; // Styles dédiés LayerManager
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
  opacity?: number;
}

interface LayerManagerProps {
  layers: LayerData[];
  activeLayerId: string | null;
  onAddLayer: (category: LayerCategory) => void;
  onRemoveLayer: (id: string) => void;
  onRenameLayer: (id: string, name: string) => void;
  onToggleLayer: (id: string) => void;
  onSelectLayer: (id: string) => void;
  onSetLayerOpacity: (id: string, opacity: number) => void;
}

const LayerManager: React.FC<LayerManagerProps> = ({
  layers,
  activeLayerId,
  onAddLayer,
  onRemoveLayer,
  onRenameLayer,
  onToggleLayer,
  onSelectLayer,
  onSetLayerOpacity,
}) => {
  const [showExportModal, setShowExportModal] = useState(false);

  const handleExportItinerary = (layerAttributes: Record<string, number>) => {
    // Récupère tous les features des calques 'chemin'
    const cheminLayers = layers.filter(layer => layer.info.category === 'chemin');
    let nodeId = -1;
    let wayId = -1;
    const nodes: { id: number; lat: number; lon: number; tags?: Record<string, string | number> }[] = [];
    const ways: { id: number; nodeRefs: number[]; tags: Record<string, string | number> }[] = [];
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
  // --- Styles extraits dans App.css ---
  // .layer-manager-container : conteneur principal du panneau
  // .layer-manager-title : titre "Calques"
  // .layer-category-block : bloc d'une catégorie de calques
  // .layer-category-title : titre de catégorie
  // .layer-list : liste des calques
  // .layer-list-item : ligne d'un calque
  // .layer-list-item.active : ligne active
  // .layer-checkbox : case visibilité
  // .layer-name : nom du calque
  // .layer-opacity : slider d'opacité
  // .layer-btn : bouton action (rename, delete)
  // .layer-add-btn : bouton ajouter calque
  // .layer-export-btn : bouton export itinéraire

  // Pour chaque catégorie, on crée une ref pour l'input file
  const fileInputRefs = {
    salles: React.createRef<HTMLInputElement>(),
    chemin: React.createRef<HTMLInputElement>(),
    fond: React.createRef<HTMLInputElement>(),
  };

  return (
    <div className="layer-manager-container">
      <h3 className="layer-manager-title">Calques</h3>
      {categories.map(cat => (
        <div key={cat} className="layer-category-block">
          <div className="layer-category-title">
            {cat === 'salles' ? 'Salles' : cat === 'chemin' ? 'Chemins' : 'Fond de carte'}
          </div>
          <ul className="layer-list">
            {layers.filter(l => l.info.category === cat).map(layer => (
              <li key={layer.info.id} className={`layer-list-item${activeLayerId === layer.info.id ? ' active' : ''}`}>
                <input type="checkbox" checked={layer.info.visible} onChange={() => onToggleLayer(layer.info.id)} className="layer-checkbox" />
                <span onClick={() => onSelectLayer(layer.info.id)} className="layer-name">{layer.info.name}</span>
                <input type="range" min="0" max="1" step="0.01" value={layer.info.opacity ?? 1} onChange={e => onSetLayerOpacity(layer.info.id, parseFloat(e.target.value))} className="layer-opacity" title="Opacité" />
                <button onClick={() => {
                  const newName = prompt('Nouveau nom du calque', layer.info.name);
                  if (newName) onRenameLayer(layer.info.id, newName);
                }} className="btn">✏️</button>
                <button onClick={() => onRemoveLayer(layer.info.id)} className="btn">🗑️</button>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <button onClick={() => onAddLayer(cat)} className="btn btn-primary">➕ Ajouter {cat === 'salles' ? 'salle' : cat === 'chemin' ? 'chemin' : 'fond'}</button>
            <div className="layer-import-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                ref={fileInputRefs[cat]}
                type="file"
                accept=".geojson,.json,.mbtiles,.osm,application/geo+json,application/json,application/vnd.mapbox-vector-tile"
                style={{ display: 'none' }}
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    // On délègue la gestion à App via un event custom
                    const importEvent = new CustomEvent('import-layer', { detail: { file, category: cat } });
                    window.dispatchEvent(importEvent);
                    e.target.value = '';
                  }
                }}
              />
              <button
                className="btn"
                title="Importer GeoJSON/MBTiles/OSM"
                onClick={() => fileInputRefs[cat].current?.click()}
              >
                📥 Importer
              </button>
            </div>
          </div>
          {cat === 'chemin' && (
            <button onClick={() => setShowExportModal(true)} className="btn btn-success">
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
